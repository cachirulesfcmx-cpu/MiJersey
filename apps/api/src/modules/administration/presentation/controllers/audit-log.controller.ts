import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { QueryAuditLogUseCase } from '../../application/use-cases/query-audit-log.use-case';
import { QueryAuditLogDto } from '../dto/query-audit-log.dto';

@Controller('admin/audit-log')
@UseGuards(PermissionsGuard)
export class AuditLogController {
  constructor(private readonly queryAuditLogUseCase: QueryAuditLogUseCase) {}

  @Get()
  @RequirePermission('admin:access')
  list(@Query() query: QueryAuditLogDto) {
    return this.queryAuditLogUseCase.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.action ? { action: query.action } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.fromDate ? { fromDate: new Date(query.fromDate) } : {}),
      ...(query.toDate ? { toDate: new Date(query.toDate) } : {}),
    });
  }
}
