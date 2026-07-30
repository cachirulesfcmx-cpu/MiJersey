import { Inject, Injectable } from '@nestjs/common';

import { GetCurrentUserUseCase } from '../../../identity/application/use-cases/get-current-user.use-case';
import { CUSTOMER_PROFILE_REPOSITORY, DEFAULT_PREFERENCES } from '../../customer.constants';
import type { CustomerProfileRepositoryPort } from '../../domain/ports/customer-profile.repository.port';

export interface MyAccountView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  phone: string | null;
  preferences: { marketingEmailsOptIn: boolean };
  createdAt: Date;
}

/** Compone el perfil de cuenta: identidad (003, reutilizada tal cual) + los campos propios de 019 (teléfono/preferencias), creando el `CustomerProfile` de forma perezosa si es la primera vez que el cliente visita su cuenta. */
@Injectable()
export class GetMyAccountUseCase {
  constructor(
    private readonly getCurrentUser: GetCurrentUserUseCase,
    @Inject(CUSTOMER_PROFILE_REPOSITORY)
    private readonly profiles: CustomerProfileRepositoryPort,
  ) {}

  async execute(userId: string): Promise<MyAccountView> {
    const [user, profile] = await Promise.all([
      this.getCurrentUser.execute(userId),
      this.profiles
        .findByUserId(userId)
        .then(
          (existing) =>
            existing ?? this.profiles.upsert(userId, { preferences: DEFAULT_PREFERENCES }),
        ),
    ]);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      phone: profile.phone,
      preferences: profile.preferences,
      createdAt: user.createdAt,
    };
  }
}
