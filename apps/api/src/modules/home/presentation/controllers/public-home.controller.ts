import { Controller, Get } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetPublicHomeUseCase } from '../../application/use-cases/get-public-home.use-case';

@Controller('home')
@Public()
export class PublicHomeController {
  constructor(private readonly getPublicHomeUseCase: GetPublicHomeUseCase) {}

  @Get()
  async get() {
    const sections = await this.getPublicHomeUseCase.execute();
    return { sections };
  }
}
