import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { CreateAddressUseCase } from '../../application/use-cases/create-address.use-case';
import { DeleteAddressUseCase } from '../../application/use-cases/delete-address.use-case';
import { ListAddressesUseCase } from '../../application/use-cases/list-addresses.use-case';
import { UpdateAddressUseCase } from '../../application/use-cases/update-address.use-case';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { CustomerExceptionFilter } from '../filters/customer-exception.filter';

@Controller('me/addresses')
@UseFilters(CustomerExceptionFilter)
export class MyAddressesController {
  constructor(
    private readonly listAddresses: ListAddressesUseCase,
    private readonly createAddress: CreateAddressUseCase,
    private readonly updateAddress: UpdateAddressUseCase,
    private readonly deleteAddress: DeleteAddressUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: AccessTokenPayload) {
    const items = await this.listAddresses.execute(user.sub);
    return { items: items.map((item) => item.toJSON()) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAddressDto, @CurrentUser() user: AccessTokenPayload) {
    const created = await this.createAddress.execute({ ...dto, customerId: user.sub });
    return created.toJSON();
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const updated = await this.updateAddress.execute({ id, customerId: user.sub, ...dto });
    return updated.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    await this.deleteAddress.execute({ id, customerId: user.sub });
  }
}
