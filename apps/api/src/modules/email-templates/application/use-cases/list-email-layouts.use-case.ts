import { Inject, Injectable } from '@nestjs/common';

import type { EmailLayoutEntity } from '../../domain/entities/email-layout.entity';
import type { EmailLayoutRepositoryPort } from '../../domain/ports/email-layout.repository.port';
import { EMAIL_LAYOUT_REPOSITORY } from '../../email-templates.constants';

@Injectable()
export class ListEmailLayoutsUseCase {
  constructor(
    @Inject(EMAIL_LAYOUT_REPOSITORY) private readonly layouts: EmailLayoutRepositoryPort,
  ) {}

  async execute(): Promise<EmailLayoutEntity[]> {
    return this.layouts.findMany();
  }
}
