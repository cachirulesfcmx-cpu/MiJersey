import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { SessionIssuerService } from './application/services/session-issuer.service';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { CreateStaffUserUseCase } from './application/use-cases/create-staff-user.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { GetUserStatsUseCase } from './application/use-cases/get-user-stats.use-case';
import { ListRolesUseCase } from './application/use-cases/list-roles.use-case';
import { ListSessionsUseCase } from './application/use-cases/list-sessions.use-case';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { RegisterCustomerUseCase } from './application/use-cases/register-customer.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { RevokeAllSessionsUseCase } from './application/use-cases/revoke-all-sessions.use-case';
import { RevokeSessionUseCase } from './application/use-cases/revoke-session.use-case';
import { SetUserActiveUseCase } from './application/use-cases/set-user-active.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { UpdateUserRoleUseCase } from './application/use-cases/update-user-role.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import {
  AUDIT_LOG_REPOSITORY,
  EMAIL_VERIFICATION_REPOSITORY,
  MAILER,
  PASSWORD_HASHER,
  PASSWORD_RESET_REPOSITORY,
  PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
  SESSION_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
  USER_STATS_REPOSITORY,
} from './identity.constants';
import { ConsoleMailer } from './infrastructure/mail/console-mailer';
import { PrismaAuditLogRepository } from './infrastructure/persistence/prisma-audit-log.repository';
import { PrismaEmailVerificationRepository } from './infrastructure/persistence/prisma-email-verification.repository';
import { PrismaPasswordResetRepository } from './infrastructure/persistence/prisma-password-reset.repository';
import { PrismaPermissionRepository } from './infrastructure/persistence/prisma-permission.repository';
import { PrismaRoleRepository } from './infrastructure/persistence/prisma-role.repository';
import { PrismaSessionRepository } from './infrastructure/persistence/prisma-session.repository';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { PrismaUserStatsRepository } from './infrastructure/persistence/prisma-user-stats.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';
import { AdminRolesController } from './presentation/controllers/admin-roles.controller';
import { AdminUsersController } from './presentation/controllers/admin-users.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { SessionsController } from './presentation/controllers/sessions.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { PermissionsGuard } from './presentation/guards/permissions.guard';

@Module({
  imports: [
    JwtModule.register({}),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
  ],
  controllers: [AuthController, SessionsController, AdminUsersController, AdminRolesController],
  providers: [
    SessionIssuerService,
    RegisterCustomerUseCase,
    LoginUseCase,
    RefreshSessionUseCase,
    RevokeSessionUseCase,
    RevokeAllSessionsUseCase,
    ListSessionsUseCase,
    GetCurrentUserUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    VerifyEmailUseCase,
    ResendVerificationUseCase,
    ChangePasswordUseCase,
    UpdateProfileUseCase,
    ListUsersUseCase,
    CreateStaffUserUseCase,
    UpdateUserRoleUseCase,
    SetUserActiveUseCase,
    ListRolesUseCase,
    GetUserStatsUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    { provide: PASSWORD_RESET_REPOSITORY, useClass: PrismaPasswordResetRepository },
    { provide: EMAIL_VERIFICATION_REPOSITORY, useClass: PrismaEmailVerificationRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
    { provide: PERMISSION_REPOSITORY, useClass: PrismaPermissionRepository },
    { provide: ROLE_REPOSITORY, useClass: PrismaRoleRepository },
    { provide: USER_STATS_REPOSITORY, useClass: PrismaUserStatsRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: MAILER, useClass: ConsoleMailer },
    JwtAuthGuard,
    PermissionsGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [
    PermissionsGuard,
    PERMISSION_REPOSITORY,
    AUDIT_LOG_REPOSITORY,
    GetUserStatsUseCase,
    TOKEN_SERVICE,
    GetCurrentUserUseCase,
    UpdateProfileUseCase,
  ],
})
export class IdentityModule {}
