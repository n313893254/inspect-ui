<script>
import { get } from '@/utils/object'
import { mapPref, GROUP_RESOURCES } from '@/store/prefs'
import ButtonGroup from '@/components/ButtonGroup'
import SortableTable from '@/components/SortableTable'
import { NAMESPACE } from '@/config/table-headers'

export default {
  components: { ButtonGroup, SortableTable },

  props: {
    schema: {
      type:    Object,
      default: null,
    },

    rows: {
      type:     Array,
      required: true
    },

    headers: {
      type:    Array,
      default: null,
    },

    groupBy: {
      type:    String,
      default: null
    },

    namespaced: {
      type:    Boolean,
      default: null, // Automatic from schema
    },

    search: {
      // Show search input to filter rows
      type:    Boolean,
      default: true
    },

    tableActions: {
      // Show bulk table actions
      type:    [Boolean, null],
      default: null
    },

    pagingLabel: {
      type:    String,
      default: 'sortableTable.paging.resource',
    },

    groupable: {
      type:    Boolean,
      default: null, // Null: auto based on namespaced
    },

    groupTooltip: {
      type:    String,
      default: 'resourceTable.groupBy.namespace',
    },
  },

  computed: {
    isNamespaced() {
      if ( this.namespaced !== null ) {
        return this.namespaced
      }

      return !!get( this.schema, 'attributes.namespaced')
    },

    showNamespaceColumn() {
      const groupNamespaces = this.group === 'namespace'
      const out = !this.showGrouping || !groupNamespaces

      return out
    },

    _showBulkActions() {
      if (this.tableActions !== null) {
        return this.tableActions
      } else if (this.schema) {
        const hideTableActions = this.$store.getters['type-map/hideBulkActionsFor'](this.schema)

        return !hideTableActions
      }

      return false
    },

    _headers() {
      let headers
      const showNamespace = this.showNamespaceColumn

      if ( this.headers ) {
        headers = this.headers.slice()
      } else {
        headers = this.$store.getters['type-map/headersFor'](this.schema)
      }

      // If only one namespace is selected, hide the namespace column
      if ( !showNamespace ) {
        const idx = headers.findIndex(header => header.name === NAMESPACE.name)

        if ( idx >= 0 ) {
          headers.splice(idx, 1)
        }
      }

      return headers
    },

    filteredRows() {
      const isAll = this.$store.getters['isAllNamespaces']

      // If the resources isn't namespaced or we want ALL of them, there's nothing to do.
      if ( !this.isNamespaced || isAll ) {
        return this.rows || []
      }

      const includedNamespaces = this.$store.getters['namespaces']()

      return this.rows.filter((row) => {
        return !!includedNamespaces[row.metadata.namespace]
      })
    },

    group: mapPref(GROUP_RESOURCES),

    showGrouping() {
      if ( this.groupable === null ) {
        return this.$store.getters['isMultipleNamespaces'] && this.isNamespaced
      }

      return this.groupable || false
    },

    computedGroupBy() {
      if ( this.groupBy ) {
        return this.groupBy
      }

      if ( this.group === 'namespace' && this.showGrouping ) {
        return 'groupByLabel'
      }

      return null
    },

    groupOptions() {
      return [
        {
          tooltipKey: 'resourceTable.groupBy.none',
          icon:       'icon-list-flat',
          value:      'none',
        },
        {
          tooltipKey: this.groupTooltip,
          icon:       'icon-folder',
          value:      'namespace',
        }
      ]
    },

    pagingParams() {
      if ( !this.schema ) {
        return {}
      }

      return {
        singularLabel: this.$store.getters['type-map/labelFor'](this.schema),
        pluralLabel:   this.$store.getters['type-map/labelFor'](this.schema, 99),
      }
    },
  },
}
</script>

<template>
  <SortableTable
    v-bind="$attrs"
    :headers="_headers"
    :rows="filteredRows"
    :group-by="computedGroupBy"
    :search="search"
    :paging="true"
    :paging-params="pagingParams"
    :paging-label="pagingLabel"
    :table-actions="_showBulkActions"
    key-field="_key"
    v-on="$listeners"
  >
    <template v-if="showGrouping" #header-middle>
      <slot name="more-header-middle" />
      <ButtonGroup v-model="group" :options="groupOptions" />
    </template>

    <template #group-by="{group: thisGroup}">
      <div class="group-tab" v-html="thisGroup.ref" />
    </template>

    <!-- Pass down templates provided by the caller -->
    <template v-for="(_, slot) of $scopedSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </SortableTable>
</template>
