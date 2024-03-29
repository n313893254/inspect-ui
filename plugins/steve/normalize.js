import { SCHEMA } from '@/config/types'

export const KEY_FIELD_FOR = {
  [SCHEMA]:  'id',
  default:  'id',
}

export function keyFieldFor(type) {
  return KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default']
}

export function normalizeType(type) {
  type = (type || '').toLowerCase()

  return type
}

export function cleanForNew(obj) {
  delete obj.id
  delete obj.actions
  delete obj.links
  delete obj.status

  if ( obj.metadata ) {
    const m = obj.metadata

    m.name = ''
    delete m.uid
    delete m.ownerReferences
    delete m.generation
    delete m.resourceVersion
    delete m.selfLink
    delete m.creationTimestamp
    delete m.deletionTimestamp
    delete m.state
    dropKeys(m.annotations)
    dropKeys(m.labels)
  }

  if ( obj?.spec?.crd?.spec?.names?.kind ) {
    obj.spec.crd.spec.names.kind = ''
  }

  return obj
}

export function cleanForAuditSave(obj) {
  delete obj.id
  delete obj.actions
  delete obj.links
  delete obj.status

  if ( obj.metadata ) {
    const m = obj.metadata

    delete m.uid
    delete m.ownerReferences
    delete m.generation
    delete m.resourceVersion
    delete m.selfLink
    delete m.creationTimestamp
    delete m.deletionTimestamp
    delete m.state
    dropKeys(m.annotations)
    dropKeys(m.labels)
  }

  return obj
}

function dropKeys(obj) {
  Object.keys(obj || {}).forEach((key) => {
    if ( key.match(/(^|.*\.)cattle\.io(\/.*|$)/) ) {
      delete obj[key]
    }
  })
}