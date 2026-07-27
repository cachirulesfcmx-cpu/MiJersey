import { Inject, Injectable } from '@nestjs/common';

import { ATTRIBUTE_REPOSITORY } from '../../attributes.constants';
import type {
  AttributeRepositoryPort,
  ListAttributesParams,
  ListAttributesResult,
} from '../../domain/ports/attribute.repository.port';

@Injectable()
export class ListAttributesUseCase {
  constructor(@Inject(ATTRIBUTE_REPOSITORY) private readonly attributes: AttributeRepositoryPort) {}

  async execute(params: ListAttributesParams): Promise<ListAttributesResult> {
    return this.attributes.findMany(params);
  }
}
