export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message);
  }
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
