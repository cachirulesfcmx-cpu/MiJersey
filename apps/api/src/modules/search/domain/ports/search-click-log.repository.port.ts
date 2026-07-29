import type { SearchResultType } from '../value-objects/search-enums';

export interface RecordSearchClickData {
  term: string;
  entityType: SearchResultType;
  entityId: string;
  sessionId?: string | null;
}

/** Registro mínimo de clic sobre un resultado — el embudo de conversión completo (compra posterior) llega con 032-Analytics. */
export interface SearchClickLogRepositoryPort {
  record(data: RecordSearchClickData): Promise<void>;
}
