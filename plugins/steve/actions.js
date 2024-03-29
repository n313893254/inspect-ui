import https from 'https'
import { SCHEMA } from '@/config/types'
import { normalizeType } from './normalize'
import { proxyFor, SELF } from '@/plugins/steve/resource-proxy'
import { cloneDeep } from 'lodash'

export default {
  async request({ dispatch }, opt) {
    opt.depaginate = opt.depaginate !== false
    opt.url = opt.url.replace(/\/*$/g, '')

    opt.httpsAgent = new https.Agent({ rejectUnauthorized: false })
    
    return this.$axios(opt).then(res => {
      if (opt.responseType) {
        return res
      } else {
        return responseObject(res)
      }
    }).catch(err => {
      if ( !err || !err.response ) {
        return Promise.reject(err)
      }

      const res = err.response

      // Go to the logout page for 401s, unless redirectUnauthorized specifically disables (for the login page)
      if ( opt.redirectUnauthorized !== false && process.client && res.status === 401 ) {
        dispatch('auth/logout', opt.logoutOnError, { root: true })
      }

      if ( typeof res.data !== 'undefined' ) {
        return Promise.reject(responseObject(res))
      }

      return Promise.reject(err)
    })

    function responseObject(res) {
      let out = res.data

      if ( typeof out !== 'object' ) {
        out = { data: out }
      }

      Object.defineProperties(out, {
        _status:     { value: res.status },
        _statusText: { value: res.statusText },
        _headers:    { value: res.headers },
        _req:        { value: res.request },
        _url:        { value: opt.url },
      })

      return out
    }
  },

  async loadSchemas(ctx) {
    const {
      getters, dispatch, commit
    } = ctx
    const res = await dispatch('findAll', { type: SCHEMA, opt: { url: 'schemas', load: false } })

    commit('loadAll', {
      ctx,
      type: SCHEMA,
      data: res.data
    })

    const all = getters.all(SCHEMA)

    return all
  },

  async findAll(ctx, { type, opt }) {
    const { getters, commit, dispatch } = ctx

    opt = opt || {}
    type = getters.normalizeType(type)

    if (!getters.typeRegistered(type)) {
      commit('registerType', type)
    }

    if ( opt.force !== true && getters['haveAll'](type) ) {
      return getters.all(type)
    }

    console.log('Find All', type) // eslint-disable-line no-console
    opt = opt || {}
    opt.url = getters.urlFor(type, null, opt)

    const res = await dispatch('request', opt)

    if ( opt.load === false ) {
      if (res.data) {
        return {
          ...res,
          data: res.data.map(d => proxyFor(ctx, d))
        }
      }
      return res
    }

    commit('loadAll', {
      ctx,
      type,
      data: res.data
    })

    if ( opt.watch !== false ) {
      dispatch('watch', {
        type,
        revision:  res.revision,
        namespace: opt.watchNamespace
      })
    }

    const all = await getters.all(type)

    return all
  },

  loadAll(ctx, { type, data }) {
    const { commit } = ctx

    commit('loadAll', {
      ctx,
      type,
      data,
    })
  },

  create(ctx, data) {
    return proxyFor(ctx, data)
  },

  promptRemove({ commit }, resources = []) {
    commit('action-menu/togglePromptRemove', resources, { root: true })
  },

  // opt:
  //  filter: Filter by fields, e.g. {field: value, anotherField: anotherValue} (default: none)
  //  limit: Number of reqords to return per page (default: 1000)
  //  sortBy: Sort by field
  //  sortOrder: asc or desc
  //  url: Use this specific URL instead of looking up the URL for the type/id.  This should only be used for bootstraping schemas on startup.
  //  @TODO depaginate: If the response is paginated, retrieve all the pages. (default: true)
  async find(ctx, { type, id, opt }) {
    const { getters, dispatch } = ctx

    opt = opt || {}

    type = normalizeType(type)

    console.log('Find', type, id) // eslint-disable-line no-console
    let out

    if ( opt.force !== true ) {
      out = getters.byId(type, id)

      if ( out ) {
        return out
      }
    }

    opt = opt || {}
    opt.url = getters.urlFor(type, id, opt)

    const res = await dispatch('request', opt)

    await dispatch('load', { data: res })

    if ( opt.watch !== false ) {
      const watchMsg = {
        type,
        id,
        revision: res?.metadata?.resourceVersion,
        force:    opt.forceWatch === true,
      }

      const idx = id.indexOf('/')

      if ( idx > 0 ) {
        watchMsg.namespace = id.substr(0, idx)
        watchMsg.id = id.substr(idx + 1)
      }

      dispatch('watch', watchMsg)
    }

    out = getters.byId(type, id)

    return out
  },
  
  load(ctx, { data, existing }) {
    const { getters, commit } = ctx

    let type = normalizeType(data.type)

    if ( !getters.typeRegistered(type) ) {
      commit('registerType', type)
    }

    if ( data.baseType && data.baseType !== data.type ) {
      type = normalizeType(data.baseType)

      if ( !getters.typeRegistered(type) ) {
        commit('registerType', type)
      }
    }

    const id = data?.id || existing?.id

    if ( !id ) {
      console.warn('Attempting to load a resource with no id', data, existing) // eslint-disable-line no-console

      return
    }

    commit('load', {
      ctx,
      data,
      existing
    })

    if ( type === SCHEMA ) {
      commit('type-map/schemaChanged', null, { root: true })
    }

    return getters['byId'](type, id)
  },

  loadMulti(ctx, entries) {
    const { commit } = ctx

    commit('loadMulti', {
      entries,
      ctx,
    })
  },

  clone(ctx, { resource } = {}) {
    const copy = cloneDeep(resource[SELF])

    return proxyFor(ctx, copy, true)
  },
}