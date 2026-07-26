import { Inject, Injectable } from '@nestjs/common';

import type { UserEntity } from '../../domain/entities/user.entity';
import { UserNotFoundError } from '../../domain/errors/identity.errors';
import type { UserRepositoryPort } from '../../domain/ports/user.repository.port';
import { USER_REPOSITORY } from '../../identity.constants';

export interface UpdateProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort) {}

  async execute(input: UpdateProfileInput): Promise<UserEntity> {
    const existing = await this.users.findById(input.userId);

    if (!existing) {
      throw new UserNotFoundError();
    }

    await this.users.updateProfile(input.userId, {
      firstName: input.firstName,
      lastName: input.lastName,
    });

    const updated = await this.users.findById(input.userId);

    if (!updated) {
      throw new UserNotFoundError();
    }

    return updated;
  }
}
