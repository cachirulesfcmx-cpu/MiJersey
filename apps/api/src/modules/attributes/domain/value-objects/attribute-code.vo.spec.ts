import { InvalidAttributeCodeError } from '../errors/attribute.errors';
import { AttributeCode } from './attribute-code.vo';

describe('AttributeCode', () => {
  it('normalizes spaces and hyphens to underscores, lowercased', () => {
    expect(AttributeCode.create('Brand Name').toString()).toBe('brand_name');
    expect(AttributeCode.create('Screen-Size').toString()).toBe('screen_size');
  });

  it('accepts an already-valid code unchanged', () => {
    expect(AttributeCode.create('color').toString()).toBe('color');
  });

  it('rejects a code starting with a digit', () => {
    expect(() => AttributeCode.create('1color')).toThrow(InvalidAttributeCodeError);
  });

  it('rejects a code with invalid characters after normalization', () => {
    expect(() => AttributeCode.create('color!')).toThrow(InvalidAttributeCodeError);
  });
});
