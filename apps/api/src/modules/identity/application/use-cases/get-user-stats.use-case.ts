import { Inject, Injectable } from '@nestjs/common';

import type {
  UserStatsRepositoryPort,
  UserStatsSnapshot,
} from '../../domain/ports/user-stats.repository.port';
import { USER_STATS_REPOSITORY } from '../../identity.constants';

@Injectable()
export class GetUserStatsUseCase {
  constructor(@Inject(USER_STATS_REPOSITORY) private readonly stats: UserStatsRepositoryPort) {}

  execute(): Promise<UserStatsSnapshot> {
    return this.stats.getSnapshot();
  }
}
