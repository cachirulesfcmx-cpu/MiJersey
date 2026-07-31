import type { PromotionEntity } from '../entities/promotion.entity';
import type { PromotionRuleEntity } from '../entities/promotion-rule.entity';

export interface EligibilityContext {
  now: Date;
  subtotal: number;
  customerId: string | null;
  productIds: string[];
  categoryIds: string[];
  brandIds: string[];
}

function splitIds(value: string): string[] {
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Evalúa una regla individual (§3/§4) contra el contexto del carrito. */
export function evaluateRule(rule: PromotionRuleEntity, context: EligibilityContext): boolean {
  switch (rule.ruleType) {
    case 'MIN_CART_AMOUNT':
      return context.subtotal >= Number(rule.value);
    case 'PRODUCT':
      return splitIds(rule.value).some((id) => context.productIds.includes(id));
    case 'CATEGORY':
      return splitIds(rule.value).some((id) => context.categoryIds.includes(id));
    case 'BRAND':
      return splitIds(rule.value).some((id) => context.brandIds.includes(id));
    case 'CUSTOMER':
      return context.customerId !== null && splitIds(rule.value).includes(context.customerId);
    default:
      return false;
  }
}

/** Vigencia por fecha y estado (§4 "Validar vigencia"), sin considerar reglas ni límite de usos. */
export function isPromotionCurrentlyValid(promotion: PromotionEntity, now: Date): boolean {
  if (promotion.status !== 'ACTIVE') return false;
  if (promotion.startsAt && promotion.startsAt > now) return false;
  if (promotion.endsAt && promotion.endsAt < now) return false;
  return true;
}

/** Elegibilidad completa (§4 "Validar elegibilidad"): vigencia + límite de usos + todas las reglas. */
export function isPromotionEligible(
  promotion: PromotionEntity,
  context: EligibilityContext,
): boolean {
  if (!isPromotionCurrentlyValid(promotion, context.now)) return false;
  if (promotion.usageLimit !== null && promotion.usageCount >= promotion.usageLimit) return false;
  return promotion.rules.every((rule) => evaluateRule(rule, context));
}

/**
 * Prioridad y compatibilidad (§4, §12): ordena por `priority` ascendente (menor número = mayor
 * prioridad) y siempre aplica la primera. Si esa promoción no es `stackable`, es la única que se
 * aplica. Si lo es, las siguientes se agregan en orden mientras ellas mismas sean `stackable`
 * — una promoción no acumulable nunca se combina con otras, aunque tenga mejor prioridad que
 * alguna ya seleccionada.
 */
export function selectApplicablePromotions(eligible: PromotionEntity[]): PromotionEntity[] {
  const sorted = [...eligible].sort((a, b) => a.priority - b.priority);
  const selected: PromotionEntity[] = [];

  for (const promotion of sorted) {
    if (selected.length === 0) {
      selected.push(promotion);
      if (!promotion.stackable) break;
    } else if (promotion.stackable) {
      selected.push(promotion);
    }
  }

  return selected;
}

/** Suma el descuento de cada promoción seleccionada sobre el subtotal original, sin exceder el subtotal total. */
export function calculateTotalDiscount(promotions: PromotionEntity[], subtotal: number): number {
  const total = promotions.reduce(
    (sum, promotion) => sum + promotion.calculateDiscount(subtotal),
    0,
  );
  return Math.min(total, subtotal);
}
