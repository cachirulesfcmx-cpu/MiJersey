export const CHECKOUT_SESSION_REPOSITORY = Symbol('CHECKOUT_SESSION_REPOSITORY');
export const CHECKOUT_ADDRESS_REPOSITORY = Symbol('CHECKOUT_ADDRESS_REPOSITORY');
export const SHIPPING_METHOD_REPOSITORY = Symbol('SHIPPING_METHOD_REPOSITORY');
export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
export const CHECKOUT_PRODUCT_LOOKUP = Symbol('CHECKOUT_PRODUCT_LOOKUP');
export const CHECKOUT_INVENTORY_AVAILABILITY = Symbol('CHECKOUT_INVENTORY_AVAILABILITY');

/** IVA general de México, simplificado a una tasa plana sobre (subtotal - descuento + envío). Un motor de impuestos por jurisdicción/categoría de producto no existe todavía en el roadmap — ver docs/checkout.md. */
export const TAX_RATE = 0.16;
