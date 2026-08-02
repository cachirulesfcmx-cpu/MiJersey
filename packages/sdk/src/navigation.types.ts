export type NavigationMenuStatus = 'DRAFT' | 'PUBLISHED';

export type NavigationItemType = 'LINK' | 'CATEGORY' | 'COLLECTION' | 'BRAND' | 'PRODUCT' | 'PAGE';

export interface NavigationVisibilityRules {
  authenticated?: boolean;
  devices?: string[];
}

export interface NavigationItem {
  id: string;
  menuId: string;
  parentId: string | null;
  label: string;
  type: NavigationItemType;
  target: string;
  icon: string | null;
  sortOrder: number;
  visibilityRules: NavigationVisibilityRules | null;
  openInNewTab: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NavigationMenu {
  id: string;
  name: string;
  location: string;
  status: NavigationMenuStatus;
  items: NavigationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface NavigationVersion {
  id: string;
  menuId: string;
  versionNumber: number;
  snapshot: {
    name: string;
    location: string;
    status: NavigationMenuStatus;
    items: NavigationItemInput[];
  };
  createdAt: string;
}

export interface NavigationItemInput {
  tempId: string;
  parentTempId?: string | null;
  label: string;
  type: NavigationItemType;
  target: string;
  icon?: string | null;
  sortOrder: number;
  visibilityRules?: NavigationVisibilityRules | null;
  openInNewTab?: boolean;
}

export interface CreateMenuInput {
  name: string;
  location: string;
  items?: NavigationItemInput[];
}

export interface UpdateMenuInput {
  name?: string;
  location?: string;
  status?: NavigationMenuStatus;
  items?: NavigationItemInput[];
}

export interface ListMenusParams {
  page?: number;
  pageSize?: number;
  location?: string;
  status?: NavigationMenuStatus;
}

export interface RenderedNavigationItem {
  id: string;
  label: string;
  type: NavigationItemType;
  href: string;
  icon: string | null;
  openInNewTab: boolean;
  children: RenderedNavigationItem[];
}

export interface RenderMenuParams {
  authenticated?: boolean;
  device?: string;
}
