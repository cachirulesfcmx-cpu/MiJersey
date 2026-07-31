export const CARRIER_REPOSITORY = Symbol('CARRIER_REPOSITORY');
export const SHIPPING_ZONE_REPOSITORY = Symbol('SHIPPING_ZONE_REPOSITORY');
export const SHIPPING_RATE_REPOSITORY = Symbol('SHIPPING_RATE_REPOSITORY');
export const SHIPMENT_REPOSITORY = Symbol('SHIPMENT_REPOSITORY');
export const SHIPMENT_EVENT_REPOSITORY = Symbol('SHIPMENT_EVENT_REPOSITORY');
export const CARRIER_PROVIDER = Symbol('CARRIER_PROVIDER');

/** Peso por defecto (kg) para variantes sin `weight` capturado — evita que el motor de tarifas falle o devuelva $0 por datos incompletos del catálogo. */
export const DEFAULT_ITEM_WEIGHT_KG = 0.5;
