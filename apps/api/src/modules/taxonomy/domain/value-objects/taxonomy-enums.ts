export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
}

export enum CollectionStatus {
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
}

export enum CollectionType {
  MANUAL = 'MANUAL',
  SMART = 'SMART',
}

export enum CollectionRuleField {
  NAME = 'NAME',
  SKU = 'SKU',
  TYPE = 'TYPE',
  STATUS = 'STATUS',
}

export enum CollectionRuleOperator {
  EQUALS = 'EQUALS',
  CONTAINS = 'CONTAINS',
}

export enum CollectionRuleMatchType {
  ALL = 'ALL',
  ANY = 'ANY',
}
