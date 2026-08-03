export enum PromotionType {
  MANUAL_COUPON = 'MANUAL_COUPON',
  AUTOMATIC = 'AUTOMATIC',
}

export enum PromotionDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum PromotionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PromotionRuleType {
  MIN_CART_AMOUNT = 'MIN_CART_AMOUNT',
  MIN_CART_QUANTITY = 'MIN_CART_QUANTITY',
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  BRAND = 'BRAND',
  CUSTOMER = 'CUSTOMER',
}

export enum PromotionRuleOperator {
  GTE = 'GTE',
  IN = 'IN',
}
