export type HomeSectionType =
  | 'HERO_BANNER'
  | 'BANNER_GRID'
  | 'FEATURED_PRODUCTS'
  | 'FEATURED_CATEGORIES'
  | 'FEATURED_COLLECTIONS'
  | 'FEATURED_BRANDS'
  | 'PROMOTION_BANNER'
  | 'RICH_TEXT'
  | 'IMAGE_TEXT'
  | 'VIDEO_BANNER'
  | 'NEWSLETTER';

export type HomeSectionStatus = 'DRAFT' | 'PUBLISHED';

export interface HomeSection {
  id: string;
  type: HomeSectionType;
  title: string;
  configuration: Record<string, unknown>;
  sortOrder: number;
  status: HomeSectionStatus;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeSectionInput {
  type: HomeSectionType;
  title: string;
  configuration: Record<string, unknown>;
  status?: HomeSectionStatus;
  isVisible?: boolean;
}

export interface UpdateHomeSectionInput {
  title?: string;
  configuration?: Record<string, unknown>;
  status?: HomeSectionStatus;
  isVisible?: boolean;
}

/** Sección pública ya enriquecida — la forma de `configuration` depende de `type` (ver docs/home.md). */
export interface PublicHomeSection {
  id: string;
  type: HomeSectionType;
  title: string;
  configuration: Record<string, unknown>;
}
