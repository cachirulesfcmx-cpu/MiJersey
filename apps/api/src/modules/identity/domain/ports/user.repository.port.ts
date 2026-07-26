import type { UserEntity } from '../entities/user.entity';
import type { RoleName } from '../value-objects/role-name';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: RoleName;
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
}

export interface ListUsersFilter {
  roles?: RoleName[];
  search?: string;
}

export interface ListUsersParams {
  filter?: ListUsersFilter;
  page: number;
  pageSize: number;
}

export interface ListUsersResult {
  items: UserEntity[];
  total: number;
}

export interface UserRepositoryPort {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;
  updateProfile(userId: string, data: UpdateProfileData): Promise<void>;
  updateRole(userId: string, role: RoleName): Promise<void>;
  setActive(userId: string, isActive: boolean): Promise<void>;
  findMany(params: ListUsersParams): Promise<ListUsersResult>;
}
