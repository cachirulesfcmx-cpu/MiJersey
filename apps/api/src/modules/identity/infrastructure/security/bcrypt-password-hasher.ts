import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import type { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { BCRYPT_SALT_ROUNDS } from '../../identity.constants';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
