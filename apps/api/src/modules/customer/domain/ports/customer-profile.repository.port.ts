import type {
  CustomerPreferences,
  CustomerProfileEntity,
} from '../entities/customer-profile.entity';

export interface UpsertCustomerProfileData {
  phone?: string | null;
  preferences?: CustomerPreferences;
}

export interface CustomerProfileRepositoryPort {
  findByUserId(userId: string): Promise<CustomerProfileEntity | null>;
  /** Crea el perfil si no existe todavía (spec: se crea perezosamente, no en el registro). */
  upsert(userId: string, data: UpsertCustomerProfileData): Promise<CustomerProfileEntity>;
}
