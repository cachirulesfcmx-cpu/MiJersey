export enum NavigationMenuStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum NavigationItemType {
  LINK = 'LINK',
  CATEGORY = 'CATEGORY',
  COLLECTION = 'COLLECTION',
  BRAND = 'BRAND',
  PRODUCT = 'PRODUCT',
  PAGE = 'PAGE',
}

/** Tipos cuyo `target` es el id de una entidad ajena, resuelta vía `NavigationLookupPort` — todo excepto `LINK`, cuyo `target` ya es la URL final. */
export const DYNAMIC_ITEM_TYPES: NavigationItemType[] = [
  NavigationItemType.CATEGORY,
  NavigationItemType.COLLECTION,
  NavigationItemType.BRAND,
  NavigationItemType.PRODUCT,
  NavigationItemType.PAGE,
];
