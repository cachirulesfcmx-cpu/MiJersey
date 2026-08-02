import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { TrackingDedupService } from './application/services/tracking-dedup.service';
import { CreateTrackingProviderUseCase } from './application/use-cases/create-tracking-provider.use-case';
import { DeleteTrackingProviderUseCase } from './application/use-cases/delete-tracking-provider.use-case';
import { GetConsentCategoriesUseCase } from './application/use-cases/get-consent-categories.use-case';
import { GetPublicTrackingProvidersUseCase } from './application/use-cases/get-public-tracking-providers.use-case';
import { ListTrackingEventsUseCase } from './application/use-cases/list-tracking-events.use-case';
import { ListTrackingProvidersUseCase } from './application/use-cases/list-tracking-providers.use-case';
import { RecordTrackingEventUseCase } from './application/use-cases/record-tracking-event.use-case';
import { TestTrackingEventUseCase } from './application/use-cases/test-tracking-event.use-case';
import { UpdateTrackingProviderUseCase } from './application/use-cases/update-tracking-provider.use-case';
import { ConsoleTrackingDispatcher } from './infrastructure/dispatch/console-tracking-dispatcher';
import { PrismaTrackingEventRepository } from './infrastructure/persistence/prisma-tracking-event.repository';
import { PrismaTrackingProviderRepository } from './infrastructure/persistence/prisma-tracking-provider.repository';
import { AdminTrackingEventsController } from './presentation/controllers/admin-tracking-events.controller';
import { AdminTrackingProvidersController } from './presentation/controllers/admin-tracking-providers.controller';
import { PublicTrackingController } from './presentation/controllers/public-tracking.controller';
import {
  TRACKING_EVENT_DISPATCHER,
  TRACKING_EVENT_REPOSITORY,
  TRACKING_PROVIDER_REPOSITORY,
} from './tracking.constants';

@Module({
  imports: [IdentityModule],
  controllers: [
    AdminTrackingProvidersController,
    AdminTrackingEventsController,
    PublicTrackingController,
  ],
  providers: [
    TrackingDedupService,
    ListTrackingProvidersUseCase,
    GetPublicTrackingProvidersUseCase,
    CreateTrackingProviderUseCase,
    UpdateTrackingProviderUseCase,
    DeleteTrackingProviderUseCase,
    ListTrackingEventsUseCase,
    TestTrackingEventUseCase,
    RecordTrackingEventUseCase,
    GetConsentCategoriesUseCase,
    { provide: TRACKING_PROVIDER_REPOSITORY, useClass: PrismaTrackingProviderRepository },
    { provide: TRACKING_EVENT_REPOSITORY, useClass: PrismaTrackingEventRepository },
    { provide: TRACKING_EVENT_DISPATCHER, useClass: ConsoleTrackingDispatcher },
  ],
  exports: [RecordTrackingEventUseCase],
})
export class TrackingModule {}
