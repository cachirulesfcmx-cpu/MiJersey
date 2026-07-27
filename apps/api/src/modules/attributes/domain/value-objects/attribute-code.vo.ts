import { InvalidAttributeCodeError } from '../errors/attribute.errors';

const CODE_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;

export class AttributeCode {
  private constructor(private readonly value: string) {}

  static create(raw: string): AttributeCode {
    const normalized = raw
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

    if (!CODE_PATTERN.test(normalized)) {
      throw new InvalidAttributeCodeError(raw);
    }

    return new AttributeCode(normalized);
  }

  toString(): string {
    return this.value;
  }
}
