export type AttributeType =
  'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'LIST' | 'COLOR' | 'MEASUREMENT';
export type AttributeStatus = 'ACTIVE' | 'ARCHIVED';

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  label: string;
  sortOrder: number;
}

export interface AttributeValueInput {
  value: string;
  label: string;
}

export interface Attribute {
  id: string;
  code: string;
  name: string;
  type: AttributeType;
  isFilterable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  sortOrder: number;
  status: AttributeStatus;
  values: AttributeValue[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttributeInput {
  code?: string;
  name: string;
  type: AttributeType;
  isFilterable?: boolean;
  isComparable?: boolean;
  isRequired?: boolean;
  values?: AttributeValueInput[];
}

export interface UpdateAttributeInput {
  name?: string;
  type?: AttributeType;
  isFilterable?: boolean;
  isComparable?: boolean;
  isRequired?: boolean;
  status?: AttributeStatus;
  values?: AttributeValueInput[];
}

export interface ListAttributesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: AttributeStatus;
  type?: AttributeType;
  isFilterable?: boolean;
}

export interface ProductAttributeView {
  attributeId: string;
  code: string;
  name: string;
  type: AttributeType;
  isRequired: boolean;
  valueId: string | null;
  valueLabel: string | null;
  customValue: string | null;
}

export interface ProductAttributeAssignment {
  id: string;
  productId: string;
  attributeId: string;
  valueId: string | null;
  customValue: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignAttributeInput {
  attributeId: string;
  valueId?: string;
  customValue?: string;
}

export interface BulkAssignAttributesInput {
  items: AssignAttributeInput[];
}

export interface AttributeFilterInput {
  attributeId: string;
  valueIds?: string[];
  customValues?: string[];
}

export interface FacetValue {
  valueId: string | null;
  value: string;
  label: string;
  count: number;
}

export interface FacetResult {
  attributeId: string;
  code: string;
  name: string;
  type: AttributeType;
  isComparable: boolean;
  values: FacetValue[];
}

export interface ProductSearchSummary {
  id: string;
  sku: string;
  slug: string;
  name: string;
  status: string;
  visibility: string;
  createdAt: string;
  imageUrl: string | null;
  price: number | null;
  compareAtPrice: number | null;
  rating: number | null;
  reviewCount: number;
  defaultVariantId: string | null;
}

/** Alcance opcional reutilizado por categorías/marcas/búsqueda (014) — el mismo motor de listados sirve a los tres. */
export interface ProductListingScope {
  categoryId?: string;
  brandId?: string;
  search?: string;
}

export interface SearchProductsParams extends ProductListingScope {
  filters?: AttributeFilterInput[];
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}
