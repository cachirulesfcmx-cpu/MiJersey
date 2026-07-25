import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { APP_CONFIG } from '../config/env.config';
import type { AppConfig } from '../config/env.schema';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    super({ datasources: { db: { url: config.databaseUrl } } });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
