<script>
import { LOGGED_OUT } from '@/config/query-params'

export default {
  layout: 'unauthenticated',

  async asyncData({ redirect, store }) {
    if ( process.env.dev ) {
      await store.dispatch('auth/logout', null, { root: true })
      redirect(302, `/auth/login?${ LOGGED_OUT }`)
    } else if (process.client) {
      window.location.replace(`${ store.getters['rancherLink'] }logout`)
    } else {
      redirect(302, `${ store.getters['rancherLink'] }logout`)
    }
  }
}
</script>

<template>
  <main>
    <h1 class="text-center mt-50">
      Logging Out&hellip;
    </h1>
  </main>
</template>
