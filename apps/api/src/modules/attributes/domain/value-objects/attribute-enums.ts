export enum AttributeType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  LIST = 'LIST',
  COLOR = 'COLOR',
  MEASUREMENT = 'MEASUREMENT',
}

export enum AttributeStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/** LIST y COLOR se resuelven contra `AttributeValue`; el resto se guarda como `customValue` libre. */
export const VALUE_BASED_TYPES = new Set<AttributeType>([AttributeType.LIST, AttributeType.COLOR]);
