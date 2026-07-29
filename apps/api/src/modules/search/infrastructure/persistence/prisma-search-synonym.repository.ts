import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import { SearchSynonymEntity } from '../../domain/entities/search-synonym.entity';
import type {
  CreateSearchSynonymData,
  SearchSynonymRepositoryPort,
  UpdateSearchSynonymData,
} from '../../domain/ports/search-synonym.repository.port';

@Injectable()
export class PrismaSearchSynonymRepository implements SearchSynonymRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SearchSynonymEntity | null> {
    const row = await this.prisma.searchSynonym.findUnique({ where: { id } });
    return row ? new SearchSynonymEntity(row) : null;
  }

  async findByTerm(term: string): Promise<SearchSynonymEntity | null> {
    const row = await this.prisma.searchSynonym.findUnique({ where: { term } });
    return row ? new SearchSynonymEntity(row) : null;
  }

  async findMany(): Promise<SearchSynonymEntity[]> {
    const rows = await this.prisma.searchSynonym.findMany({ orderBy: { term: 'asc' } });
    return rows.map((row) => new SearchSynonymEntity(row));
  }

  async findExpansions(term: string): Promise<string[]> {
    const row = await this.prisma.searchSynonym.findFirst({
      where: { OR: [{ term }, { synonyms: { has: term } }] },
    });
    if (!row) return [term];
    return [...new Set([row.term, ...row.synonyms, term])];
  }

  async create(data: CreateSearchSynonymData): Promise<SearchSynonymEntity> {
    const row = await this.prisma.searchSynonym.create({ data });
    return new SearchSynonymEntity(row);
  }

  async update(id: string, data: UpdateSearchSynonymData): Promise<SearchSynonymEntity> {
    const row = await this.prisma.searchSynonym.update({ where: { id }, data });
    return new SearchSynonymEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.searchSynonym.delete({ where: { id } });
  }
}
