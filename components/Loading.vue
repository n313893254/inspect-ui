<script>
export default {
  props: {
    loading: {
      type:    Boolean,
      default: true,
    }
  },
}
</script>

<template>
  <div v-if="loading">
    <div class="overlay" />
    <div class="content">
      Loading...
    </div>
  </div>
  <div v-else>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .overlay {
    z-index: z-index('loadingOverlay');
    background-color: var(--overlay-bg);
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }

  .content {
    position: absolute;
    top: 50vh;
    left: 0;
    right: 0;
    text-align: center;
    z-index: z-index('loadingContent');
  }
</style>
