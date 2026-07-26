import { Inject, Injectable } from '@nestjs/common';

import type { UserEntity } from '../../domain/entities/user.entity';
import { SessionNotFoundError } from '../../domain/errors/identity.errors';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { USER_REPOSITORY } from '../../identity.constants';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}

  async execute(userId: string): Promise<UserEntity> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new SessionNotFoundError();
    }

    return user;
  }
}
