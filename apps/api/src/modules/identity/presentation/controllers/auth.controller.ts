import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Ip,
  Post,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { Public } from '../../../../common/decorators/public.decorator';
import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshSessionUseCase } from '../../application/use-cases/refresh-session.use-case';
import { RegisterCustomerUseCase } from '../../application/use-cases/register-customer.use-case';
import { ResendVerificationUseCase } from '../../application/use-cases/resend-verification.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { RevokeSessionUseCase } from '../../application/use-cases/revoke-session.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { SessionNotFoundError } from '../../domain/errors/identity.errors';
import type { PermissionRepositoryPort } from '../../domain/ports/permission.repository.port';
import type { AccessTokenPayload } from '../../domain/ports/token.service.port';
import {
  PERMISSION_REPOSITORY,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_TTL_DAYS,
} from '../../identity.constants';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { IdentityExceptionFilter } from '../filters/identity-exception.filter';

const REFRESH_COOKIE_MAX_AGE_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

@Controller('auth')
@UseFilters(IdentityExceptionFilter)
export class AuthController {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepositoryPort,
    private readonly registerCustomerUseCase: RegisterCustomerUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto, @Ip() ip: string) {
    const user = await this.registerCustomerUseCase.execute({ ...dto, ipAddress: ip });
    return user.toPublicProfile();
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
      userAgent: req.headers['user-agent'] ?? null,
      ipAddress: ip,
    });

    this.setRefreshCookie(res, result.refreshToken);

    return { user: result.user.toPublicProfile(), accessToken: result.accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as string | undefined;

    if (!rawRefreshToken) {
      throw new SessionNotFoundError();
    }

    const result = await this.refreshSessionUseCase.execute(rawRefreshToken);
    this.setRefreshCookie(res, result.refreshToken);

    return { user: result.user.toPublicProfile(), accessToken: result.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.revokeSessionUseCase.execute({
      sessionId: user.sid,
      requestingUserId: user.sub,
      ipAddress: ip,
    });
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/' });
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.forgotPasswordUseCase.execute(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto, @Ip() ip: string) {
    await this.resetPasswordUseCase.execute({
      token: dto.token,
      newPassword: dto.newPassword,
      ipAddress: ip,
    });
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    await this.changePasswordUseCase.execute({
      userId: user.sub,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      currentSessionId: user.sid,
      ipAddress: ip,
    });
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.verifyEmailUseCase.execute(dto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.resendVerificationUseCase.execute(dto.email);
  }

  @Get('me')
  async me(@CurrentUser() user: AccessTokenPayload) {
    const currentUser = await this.getCurrentUserUseCase.execute(user.sub);
    const permissionKeys = await this.permissions.getPermissionKeysForRole(currentUser.role);

    return { ...currentUser.toPublicProfile(), permissions: permissionKeys };
  }

  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
      path: '/',
    });
  }
}
