import { Inject, Injectable } from '@nestjs/common';

import { ATTRIBUTE_REPOSITORY } from '../../attributes.constants';
import type { AttributeEntity } from '../../domain/entities/attribute.entity';
import { AttributeNotFoundError } from '../../domain/errors/attribute.errors';
import type { AttributeRepositoryPort } from '../../domain/ports/attribute.repository.port';

@Injectable()
export class GetAttributeUseCase {
  constructor(@Inject(ATTRIBUTE_REPOSITORY) private readonly attributes: AttributeRepositoryPort) {}

  async execute(id: string): Promise<AttributeEntity> {
    const attribute = await this.attributes.findById(id);
    if (!attribute) {
      throw new AttributeNotFoundError();
    }
    return attribute;
  }
}
