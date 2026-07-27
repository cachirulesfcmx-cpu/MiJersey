import type { AttributeEntity } from '../../domain/entities/attribute.entity';
import { InvalidAttributeAssignmentError } from '../../domain/errors/attribute.errors';
import { VALUE_BASED_TYPES } from '../../domain/value-objects/attribute-enums';

export interface ResolvedAssignmentValue {
  valueId: string | null;
  customValue: string | null;
}

export function validateAssignmentValue(
  attribute: AttributeEntity,
  valueId: string | null | undefined,
  customValue: string | null | undefined,
): ResolvedAssignmentValue {
  if (VALUE_BASED_TYPES.has(attribute.type)) {
    const trimmed = valueId?.trim();
    if (!trimmed || !attribute.values.some((value) => value.id === trimmed)) {
      throw new InvalidAttributeAssignmentError(
        'Este atributo requiere un valor válido de su lista',
      );
    }
    return { valueId: trimmed, customValue: null };
  }

  const trimmed = customValue?.trim();
  if (!trimmed) {
    throw new InvalidAttributeAssignmentError('Este atributo requiere un valor de texto');
  }
  return { valueId: null, customValue: trimmed };
}
