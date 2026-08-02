import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { EmailTemplateCacheService } from './application/services/email-template-cache.service';
import { CreateEmailLayoutUseCase } from './application/use-cases/create-email-layout.use-case';
import { CreateEmailTemplateUseCase } from './application/use-cases/create-email-template.use-case';
import { DeleteEmailLayoutUseCase } from './application/use-cases/delete-email-layout.use-case';
import { DeleteEmailTemplateUseCase } from './application/use-cases/delete-email-template.use-case';
import { GetEmailTemplateUseCase } from './application/use-cases/get-email-template.use-case';
import { ListEmailLayoutsUseCase } from './application/use-cases/list-email-layouts.use-case';
import { ListEmailTemplateVersionsUseCase } from './application/use-cases/list-email-template-versions.use-case';
import { ListEmailTemplatesUseCase } from './application/use-cases/list-email-templates.use-case';
import { PublishEmailTemplateUseCase } from './application/use-cases/publish-email-template.use-case';
import { RestoreEmailTemplateVersionUseCase } from './application/use-cases/restore-email-template-version.use-case';
import { TestSendEmailTemplateUseCase } from './application/use-cases/test-send-email-template.use-case';
import { UpdateEmailLayoutUseCase } from './application/use-cases/update-email-layout.use-case';
import { UpdateEmailTemplateUseCase } from './application/use-cases/update-email-template.use-case';
import {
  EMAIL_LAYOUT_REPOSITORY,
  EMAIL_TEMPLATE_REPOSITORY,
  EMAIL_TEMPLATE_VERSION_REPOSITORY,
  EMAIL_TRANSPORT,
} from './email-templates.constants';
import { NodemailerEmailTransport } from './infrastructure/mail/nodemailer-email-transport';
import { PrismaEmailLayoutRepository } from './infrastructure/persistence/prisma-email-layout.repository';
import { PrismaEmailTemplateRepository } from './infrastructure/persistence/prisma-email-template.repository';
import { PrismaEmailTemplateVersionRepository } from './infrastructure/persistence/prisma-email-template-version.repository';
import { AdminEmailLayoutController } from './presentation/controllers/admin-email-layout.controller';
import { AdminEmailTemplateController } from './presentation/controllers/admin-email-template.controller';

@Module({
  imports: [IdentityModule],
  controllers: [AdminEmailTemplateController, AdminEmailLayoutController],
  providers: [
    EmailTemplateCacheService,
    ListEmailTemplatesUseCase,
    GetEmailTemplateUseCase,
    CreateEmailTemplateUseCase,
    UpdateEmailTemplateUseCase,
    DeleteEmailTemplateUseCase,
    PublishEmailTemplateUseCase,
    TestSendEmailTemplateUseCase,
    ListEmailTemplateVersionsUseCase,
    RestoreEmailTemplateVersionUseCase,
    ListEmailLayoutsUseCase,
    CreateEmailLayoutUseCase,
    UpdateEmailLayoutUseCase,
    DeleteEmailLayoutUseCase,
    { provide: EMAIL_TEMPLATE_REPOSITORY, useClass: PrismaEmailTemplateRepository },
    { provide: EMAIL_TEMPLATE_VERSION_REPOSITORY, useClass: PrismaEmailTemplateVersionRepository },
    { provide: EMAIL_LAYOUT_REPOSITORY, useClass: PrismaEmailLayoutRepository },
    { provide: EMAIL_TRANSPORT, useClass: NodemailerEmailTransport },
  ],
})
export class EmailTemplatesModule {}
