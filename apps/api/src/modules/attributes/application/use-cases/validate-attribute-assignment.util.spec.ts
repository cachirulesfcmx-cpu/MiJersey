import { AttributeEntity } from '../../domain/entities/attribute.entity';
import { AttributeValueEntity } from '../../domain/entities/attribute-value.entity';
import { InvalidAttributeAssignmentError } from '../../domain/errors/attribute.errors';
import { AttributeStatus, AttributeType } from '../../domain/value-objects/attribute-enums';
import { validateAssignmentValue } from './validate-attribute-assignment.util';

function buildAttribute(overrides: Partial<{ type: AttributeType }> = {}): AttributeEntity {
  return new AttributeEntity({
    id: 'attr-1',
    code: 'color',
    name: 'Color',
    type: overrides.type ?? AttributeType.LIST,
    isFilterable: true,
    isComparable: false,
    isRequired: false,
    sortOrder: 0,
    status: AttributeStatus.ACTIVE,
    values: [
      new AttributeValueEntity({
        id: 'val-1',
        attributeId: 'attr-1',
        value: 'red',
        label: 'Rojo',
        sortOrder: 0,
      }),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('validateAssignmentValue', () => {
  it('accepts a known valueId for a LIST attribute', () => {
    const attribute = buildAttribute({ type: AttributeType.LIST });
    expect(validateAssignmentValue(attribute, 'val-1', undefined)).toEqual({
      valueId: 'val-1',
      customValue: null,
    });
  });

  it('rejects a valueId that does not belong to the attribute', () => {
    const attribute = buildAttribute({ type: AttributeType.LIST });
    expect(() => validateAssignmentValue(attribute, 'unknown-value', undefined)).toThrow(
      InvalidAttributeAssignmentError,
    );
  });

  it('rejects a missing valueId for a value-based attribute', () => {
    const attribute = buildAttribute({ type: AttributeType.COLOR });
    expect(() => validateAssignmentValue(attribute, undefined, undefined)).toThrow(
      InvalidAttributeAssignmentError,
    );
  });

  it('accepts a customValue for a TEXT attribute', () => {
    const attribute = buildAttribute({ type: AttributeType.TEXT });
    expect(validateAssignmentValue(attribute, undefined, '  170 cm  ')).toEqual({
      valueId: null,
      customValue: '170 cm',
    });
  });

  it('rejects an empty customValue for a TEXT attribute', () => {
    const attribute = buildAttribute({ type: AttributeType.TEXT });
    expect(() => validateAssignmentValue(attribute, undefined, '   ')).toThrow(
      InvalidAttributeAssignmentError,
    );
  });
});
