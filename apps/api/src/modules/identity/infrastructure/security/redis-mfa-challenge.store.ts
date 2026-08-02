import { randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import type { MfaChallengeStorePort } from '../../domain/ports/mfa-challenge-store.port';
import { MFA_CHALLENGE_TTL_SECONDS } from '../../identity.constants';

const KEY_PREFIX = 'auth:mfa-challenge:';

@Injectable()
export class RedisMfaChallengeStore implements MfaChallengeStorePort {
  constructor(private readonly redis: RedisService) {}

  async create(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.client.set(`${KEY_PREFIX}${token}`, userId, 'EX', MFA_CHALLENGE_TTL_SECONDS);
    return token;
  }

  peek(challengeToken: string): Promise<string | null> {
    return this.redis.client.get(`${KEY_PREFIX}${challengeToken}`);
  }

  async invalidate(challengeToken: string): Promise<void> {
    await this.redis.client.del(`${KEY_PREFIX}${challengeToken}`);
  }
}
