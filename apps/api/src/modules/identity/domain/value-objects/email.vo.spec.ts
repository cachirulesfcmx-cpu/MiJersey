import { InvalidEmailError } from '../errors/identity.errors';
import { Email } from './email.vo';

describe('Email', () => {
  it('normalizes valid emails to lowercase and trimmed', () => {
    const email = Email.create('  User@Example.com  ');
    expect(email.toString()).toBe('user@example.com');
  });

  it('rejects malformed emails', () => {
    expect(() => Email.create('not-an-email')).toThrow(InvalidEmailError);
  });
});
