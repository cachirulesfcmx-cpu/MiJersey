import type { RoleName } from '../value-objects/role-name';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: RoleName;
  emailVerifiedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export class UserEntity {
  constructor(private readonly props: UserProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  get role(): RoleName {
    return this.props.role;
  }

  get isEmailVerified(): boolean {
    return this.props.emailVerifiedAt !== null;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  canAuthenticate(): boolean {
    return this.props.isActive;
  }

  toPublicProfile(): {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: RoleName;
    isEmailVerified: boolean;
    createdAt: Date;
  } {
    return {
      id: this.props.id,
      email: this.props.email,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      role: this.props.role,
      isEmailVerified: this.isEmailVerified,
      createdAt: this.props.createdAt,
    };
  }
}
