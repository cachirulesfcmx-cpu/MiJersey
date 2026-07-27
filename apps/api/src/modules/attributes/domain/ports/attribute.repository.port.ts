import type { AttributeEntity } from '../entities/attribute.entity';
import type { AttributeStatus, AttributeType } from '../value-objects/attribute-enums';

export interface AttributeValueInput {
  value: string;
  label: string;
}

export interface CreateAttributeData {
  code: string;
  name: string;
  type: AttributeType;
  isFilterable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  values: AttributeValueInput[];
}

export interface UpdateAttributeData {
  name?: string;
  type?: AttributeType;
  isFilterable?: boolean;
  isComparable?: boolean;
  isRequired?: boolean;
  status?: AttributeStatus;
}

export interface ListAttributesFilter {
  search?: string;
  status?: AttributeStatus[];
  type?: AttributeType[];
  isFilterable?: boolean;
}

export interface ListAttributesParams {
  filter?: ListAttributesFilter;
  page: number;
  pageSize: number;
}

export interface ListAttributesResult {
  items: AttributeEntity[];
  total: number;
}

export interface AttributeRepositoryPort {
  findById(id: string): Promise<AttributeEntity | null>;
  findByCode(code: string): Promise<AttributeEntity | null>;
  existsByCode(code: string): Promise<boolean>;
  findByIds(ids: string[]): Promise<AttributeEntity[]>;
  /** `status: ACTIVE`, `isFilterable: true`, no eliminados — usado por el motor de filtros público. */
  findAllFilterable(): Promise<AttributeEntity[]>;
  findMany(params: ListAttributesParams): Promise<ListAttributesResult>;
  create(data: CreateAttributeData): Promise<AttributeEntity>;
  update(id: string, data: UpdateAttributeData): Promise<AttributeEntity>;
  /** Reemplaza la lista completa de valores (agrega/quita/reordena por posición). */
  replaceValues(attributeId: string, values: AttributeValueInput[]): Promise<void>;
  softDelete(id: string): Promise<void>;
  countAssignments(attributeId: string): Promise<number>;
  countValueAssignments(valueId: string): Promise<number>;
}
