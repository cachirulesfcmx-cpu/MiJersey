import type { HomeSectionEntity, HomeSectionProps } from '../entities/home-section.entity';
import type { HomeSectionConfiguration } from '../value-objects/home-section-config';
import type { HomeSectionStatus, HomeSectionType } from '../value-objects/home-section-enums';

export interface CreateHomeSectionData {
  type: HomeSectionType;
  title: string;
  configuration: HomeSectionConfiguration;
  sortOrder: number;
  status: HomeSectionStatus;
  isVisible: boolean;
}

export type UpdateHomeSectionData = Partial<
  Omit<CreateHomeSectionData, 'type'> & { sortOrder: number }
>;

export interface HomeSectionRepositoryPort {
  findAll(): Promise<HomeSectionEntity[]>;
  findPublished(): Promise<HomeSectionEntity[]>;
  findById(id: string): Promise<HomeSectionEntity | null>;
  create(data: CreateHomeSectionData): Promise<HomeSectionEntity>;
  update(id: string, data: UpdateHomeSectionData): Promise<HomeSectionEntity>;
  delete(id: string): Promise<void>;
  reorder(order: string[]): Promise<void>;
  maxSortOrder(): Promise<number>;
}

export type { HomeSectionProps };
