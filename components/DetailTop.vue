<script>
import Tag from '@/components/Tag'
import isEmpty from 'lodash/isEmpty'
import DetailText from '@/components/DetailText'
import { _VIEW } from '@/config/query-params'

export default {
  components: { DetailText, Tag },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {}
      }
    },

    moreDetails: {
      type:    Array,
      default: () => {
        return []
      }
    }
  },

  data() {
    return { annotationsVisible: false, view: _VIEW }
  },

  computed: {
    details() {
      return [
        ...(this.moreDetails || []),
        ...(this.value?.details || []),
      ]
    },

    labels() {
      return this.value?.labels || {}
    },

    annotations() {
      return this.value?.annotations || {}
    },

    description() {
      return this.value?.description
    },

    hasDetails() {
      return !isEmpty(this.details)
    },

    hasLabels() {
      return !isEmpty(this.labels)
    },

    hasAnnotations() {
      return !isEmpty(this.annotations)
    },

    hasDescription() {
      return !isEmpty(this.description)
    },

    annotationCount() {
      return Object.keys(this.annotations || {}).length
    },

    isEmpty() {
      const hasAnything = this.hasDetails || this.hasLabels || this.hasAnnotations || this.hasDescription

      return !hasAnything
    },
  },
  methods: {
    toggleAnnotations() {
      this.annotationsVisible = !this.annotationsVisible
    }
  }
}
</script>

<template>
  <div class="detail-top" :class="{empty: isEmpty}">
    <div v-if="description" class="description">
      <span class="label">
        {{ t('resourceDetail.detailTop.description') }}:
      </span>
      <span class="content">{{ description }}</span>
    </div>

    <div class="details">
      <div v-for="detail in details" :key="detail.label || detail.slotName" class="detail">
        <span class="label">
          {{ detail.label }}:
        </span>
        <component
          :is="detail.formatter"
          v-if="detail.formatter"
          :value="detail.content"
          v-bind="detail.formatterOpts"
        />
        <span v-else>{{ detail.content }}</span>
      </div>
    </div>

    <div v-if="hasLabels" class="labels">
      <div class="tags">
        <span class="label">
          {{ t('resourceDetail.detailTop.labels') }}:
        </span>
        <Tag v-for="(prop, key) in labels" :key="key + prop">
          {{ key }}<span v-if="prop">: </span>{{ prop }}
        </Tag>
      </div>
    </div>

    <div v-if="hasAnnotations" class="annotations">
      <span class="label">
        {{ t('resourceDetail.detailTop.annotations') }}:
      </span>
      <a href="#" @click.prevent="toggleAnnotations">
        {{ t(`resourceDetail.detailTop.${annotationsVisible? 'hideAnnotations' : 'showAnnotations'}`, {annotations: annotationCount}) }}
      </a>
      <div v-if="annotationsVisible">
        <DetailText v-for="(val, key) in annotations" :key="key" class="annotation" :value="val" :label="key" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .detail-top {
    $spacing: 5px;

    &:not(.empty) {
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 10px;
    }

    .tags {
      display: inline-flex;
      flex-direction: row;
      flex-wrap: wrap;
      position: relative;
      top: $spacing * -1/2;

      .label {
        position: relative;
        top: $spacing;
      }

      .tag {
        margin: $spacing/2 $spacing $spacing $spacing/2;
        font-size: 12px;
      }
    }

    .annotation {
      margin-top: 10px;
    }

    .label {
      color: var(--input-label);
      margin: 0 4px 0 0;
    }

    .details {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      margin-bottom: 5px;

      .detail {
        margin-right: 20px;
      }
    }
  }
</style>
