<script>
import ArrayList from '@/components/form/ArrayList'
import InfoBox from '@/components/InfoBox'
import { _VIEW } from '@/config/query-params'

export default {
  components: { ArrayList, InfoBox },
  computed:   {
    isDisabled() {
      return this.$attrs.mode === _VIEW
    }
  }
}
</script>

<template>
  <ArrayList class="array-list-grouped" v-bind="$attrs" @input="$emit('input', $event)" @add="$emit('add')">
    <template #columns="scope">
      <InfoBox :class="{'pt-40': !isDisabled}">
        <slot v-bind="scope" />
      </InfoBox>
    </template>
    <template #remove-button="scope">
      <button v-if="!isDisabled" type="button" class="btn role-link close btn-sm" @click="scope.remove">
        <i class="icon icon-2x icon-x" />
      </button>
      <span v-else />
    </template>
    <!-- Pass down templates provided by the caller -->
    <template v-for="(_, slot) of $scopedSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </ArrayList>
</template>

<style lang="scss">
.array-list-grouped {
    & > .box {
      position: relative;
      display: block;

      & > .remove {
        position: absolute;

        padding: 0px;

        top: 0;
        right: 0;
      }

      & > .info-box {
        margin-bottom: 0;
      }
    }
}
</style>
