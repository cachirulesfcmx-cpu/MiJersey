export interface UserStatsSnapshot {
  totalUsers: number;
  totalCustomers: number;
  totalStaff: number;
  totalActiveUsers: number;
}

export interface UserStatsRepositoryPort {
  getSnapshot(): Promise<UserStatsSnapshot>;
}
