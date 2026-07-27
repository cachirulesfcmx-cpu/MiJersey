import { InvalidSlugError } from '../errors/media.errors';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class Slug {
  private constructor(private readonly value: string) {}

  static create(raw: string): Slug {
    const normalized = raw.trim().toLowerCase();

    if (!SLUG_PATTERN.test(normalized)) {
      throw new InvalidSlugError(raw);
    }

    return new Slug(normalized);
  }

  toString(): string {
    return this.value;
  }
}
