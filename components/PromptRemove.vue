<script>
import { mapState, mapGetters } from 'vuex'
import { get, isEmpty } from '@/utils/object'
import { NAMESPACE, NODE, RIO } from '@/config/types'
import Card from '@/components/Card'
import { alternateLabel } from '@/utils/platform'
import LinkDetail from '@/components/formatter/LinkDetail'
import { uniq } from '@/utils/array'
import AsyncButton from '@/components/AsyncButton'

export default {
  components: {
    Card, LinkDetail, AsyncButton
  },
  data() {
    return {
      confirmName: '', error: '', warning: '', preventDelete: false
    }
  },
  computed:   {
    names() {
      return this.toRemove.map(obj => obj.nameDisplay).slice(0, 5)
    },

    type() {
      const types = new Set(this.toRemove.reduce((array, each) => {
        array.push(each.type)

        return array
      }, []))

      if (types.size > 1) {
        return this.t('generic.resource', { count: this.toRemove.length })
      }

      const schema = this.toRemove[0]?.schema

      if ( !schema ) {
        return `resource${ this.toRemove.length === 1 ? '' : 's' }`
      }

      return this.$store.getters['type-map/labelFor'](schema, this.toRemove.length)
    },

    selfLinks() {
      return this.toRemove.map((resource) => {
        return get(resource, 'links.self')
      })
    },

    needsConfirm() {
      const first = this.toRemove[0]

      if ( !first ) {
        return false
      }
      const type = first.type

      return (type === NAMESPACE || type === NODE || type === RIO.STACK) && this.toRemove.length === 1
    },

    plusMore() {
      const remaining = this.toRemove.length - this.names.length

      return this.t('promptRemove.andOthers', { count: remaining })
    },

    // if the current route ends with the ID of the resource being deleted, whatever page this is wont be valid after successful deletion: navigate away
    doneLocation() {
      // if deleting more than one resource, this is happening in list view and shouldn't redirect anywhere
      if (this.toRemove.length > 1) {
        return null
      }
      const currentRoute = this.toRemove[0].currentRoute()
      const out = {}
      const params = { ...currentRoute.params }

      if (params.id && (params.id === this.toRemove[0]?.metadata?.name || params.id === this.toRemove[0].id)) {
        if (this.toRemove[0]?.listLocation) {
          return this.toRemove[0]?.listLocation
        }

        let { name = '' } = currentRoute

        name = name.slice(0, name.indexOf('-id'))

        if (params.namespace) {
          name = name.slice(0, name.indexOf('-namespace'))
          delete params.namespace
        }
        delete params.id

        out.params = params
        out.name = name
      }

      return out
    },

    currentRouter() {
      // ...don't need a router if there's no route to go to
      if (!this.doneLocation) {
        return null
      } else {
        return this.toRemove[0].currentRouter()
      }
    },

    protip() {
      return this.t('promptRemove.protip', { alternateLabel })
    },

    deleteDisabled() {
      const confirmFailed = this.needsConfirm && this.confirmName !== this.names[0]

      return this.preventDelete || confirmFailed
    },

    ...mapState('action-menu', ['showPromptRemove', 'toRemove']),
    ...mapGetters({ t: 'i18n/t' })
  },

  watch:    {
    showPromptRemove(show) {
      if (show) {
        this.$modal.show('promptRemove')
      } else {
        this.$modal.hide('promptRemove')
      }
    },

    // check for any resources with a deletion prevention message,
    // if none found (delete is allowed), then check for any resources with a warning message
    toRemove(neu) {
      let message
      const preventDeletionMessages = neu.filter(item => item.preventDeletionMessage)

      this.preventDelete = false

      if (preventDeletionMessages.length) {
        this.preventDelete = true
        message = preventDeletionMessages[0].preventDeletionMessage
      } else {
        const warnDeletionMessages = neu.filter(item => item.warnDeletionMessage)

        if (warnDeletionMessages.length) {
          message = warnDeletionMessages[0].warnDeletionMessage
        }
      }
      if (typeof message === 'function' ) {
        this.warning = message(this.toRemove)
      } else if (message) {
        this.warning = message
      } else {
        this.warning = ''
      }
    }
  },

  methods: {
    close() {
      this.confirmName = ''
      this.error = ''
      this.$store.commit('action-menu/togglePromptRemove')
    },

    remove(btnCB) {
      // if doneLocation is defined, redirect after deleting
      let goTo

      if (this.doneLocation) {
        // doneLocation will recompute to undefined when delete request completes
        goTo = { ...this.doneLocation }
      }

      const serialRemove = this.toRemove.some(resource => resource.removeSerially)

      if (serialRemove) {
        this.serialRemove(goTo, btnCB)
      } else {
        this.parallelRemove(goTo, btnCB)
      }
    },

    async serialRemove(goTo, btnCB) {
      try {
        const spoofedTypes = this.getSpoofedTypes(this.toRemove)

        for (const resource of this.toRemove) {
          await resource.remove()
        }

        await this.refreshSpoofedTypes(spoofedTypes)

        if ( goTo && !isEmpty(goTo) ) {
          this.currentRouter.push(goTo)
        }
        btnCB(true)
        this.close()
      } catch (err) {
        this.error = err
        btnCB(false)
      }
    },

    async parallelRemove(goTo, btnCB) {
      try {
        const spoofedTypes = this.getSpoofedTypes(this.toRemove)

        await Promise.all(this.toRemove.map(resource => resource.remove()))
        await this.refreshSpoofedTypes(spoofedTypes)

        if ( goTo && !isEmpty(goTo) ) {
          this.currentRouter.push(goTo)
        }
        btnCB(true)
        this.close()
      } catch (err) {
        this.error = err
        btnCB(false)
      }
    },

    getSpoofedTypes() {
      const uniqueResourceTypes = uniq(this.toRemove.map(resource => resource.type))

      return uniqueResourceTypes.filter(this.$store.getters['type-map/isSpoofed'])
    },

    // If spoofed we need to reload the values as the server can't have watchers for them.
    refreshSpoofedTypes(types) {
      const promises = types.map(type => this.$store.dispatch('cluster/findAll', { type, opt: { force: true } }, { root: true }))

      return Promise.all(promises)
    }
  }
}
</script>

<template>
  <modal
    class="remove-modal"
    name="promptRemove"
    :width="350"
    height="auto"
    styles="max-height: 100vh;"
  >
    <Card class="prompt-remove" :show-highlight-border="false">
      <h4 slot="title" class="text-default-text">
        Are you sure?
      </h4>
      <div slot="body">
        <div class="mb-10">
          {{ t('promptRemove.attemptingToRemove', {type}) }} <template v-for="(resource, i) in names">
            <template v-if="i<5">
              <LinkDetail :key="resource" :value="resource" :row="toRemove[i]" @click.native="close" />
              <span v-if="i===names.length-1" :key="resource+2">{{ plusMore }}</span><span v-else :key="resource+1">{{ i === toRemove.length-2 ? ', and ' : ', ' }}</span>
            </template>
          </template>
          <span v-if="needsConfirm" :key="resource">Re-enter its name below to confirm:</span>
        </div>
        <input v-if="needsConfirm" id="confirm" v-model="confirmName" type="text">
        <div class="mb-10">
          {{ warning }}
        </div>
        <div class="text-error mb-10">
          {{ error }}
        </div>
        <div v-if="!needsConfirm" class="text-info mt-20">
          {{ protip }}
        </div>
      </div>
      <template #actions>
        <button class="btn role-secondary" @click="close">
          Cancel
        </button>
        <AsyncButton mode="delete" class="btn bg-error ml-10" :disabled="deleteDisabled" @click="remove" />
      </template>
    </Card>
  </modal>
</template>

<style lang='scss'>
  .prompt-remove {
    &.card-container {
      box-shadow: none;
    }
    #confirm {
      width: 90%;
      margin-left: 3px;
    }

    .remove-modal {
        border-radius: var(--border-radius);
        overflow: scroll;
        max-height: 100vh;
        & ::-webkit-scrollbar-corner {
          background: rgba(0,0,0,0);
        }
    }

    .actions {
      text-align: right;
    }
    .card-actions {
      display: flex;
      justify-content: center;
    }
  }
</style>
