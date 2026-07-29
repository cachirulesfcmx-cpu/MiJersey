import type { SearchSynonymEntity } from '../entities/search-synonym.entity';

export interface CreateSearchSynonymData {
  term: string;
  synonyms: string[];
}

export interface UpdateSearchSynonymData {
  term?: string;
  synonyms?: string[];
}

export interface SearchSynonymRepositoryPort {
  findById(id: string): Promise<SearchSynonymEntity | null>;
  findByTerm(term: string): Promise<SearchSynonymEntity | null>;
  findMany(): Promise<SearchSynonymEntity[]>;
  /** Busca el grupo cuyo `term` o `synonyms` contenga `term`, y devuelve la unión de todos sus miembros (incluido el propio `term` de búsqueda). Sin grupo, devuelve `[term]`. */
  findExpansions(term: string): Promise<string[]>;
  create(data: CreateSearchSynonymData): Promise<SearchSynonymEntity>;
  update(id: string, data: UpdateSearchSynonymData): Promise<SearchSynonymEntity>;
  delete(id: string): Promise<void>;
}
