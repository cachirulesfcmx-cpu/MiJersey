import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  SearchLookupPort,
  SearchProductsResult,
  SearchResultItem,
} from '../../domain/ports/search-lookup.port';
import { SearchResultType } from '../../domain/value-objects/search-enums';
import { MIN_TRIGRAM_SIMILARITY } from '../../search.constants';

/** Pesos de "ranking configurable" (spec §5) — constantes nombradas en vez de una tabla editable por admin, ver docs/search.md "Alcance diferido". */
const SKU_EXACT_SCORE = 100;
const NAME_EXACT_SCORE = 90;
const NAME_PREFIX_SCORE = 70;
const NAME_CONTAINS_SCORE = 50;
const SKU_CONTAINS_SCORE = 40;
const DESCRIPTION_CONTAINS_SCORE = 20;
/** Tope de candidatos traídos antes de rankear en memoria — evita cargar catálogos enormes solo para ordenar por relevancia. */
const CANDIDATE_POOL_SIZE = 200;

interface ProductCandidate {
  id: string;
  slug: string;
  name: string;
  sku: string;
  description: string | null;
}

function scoreProduct(candidate: ProductCandidate, term: string): number {
  const name = candidate.name.toLowerCase();
  const sku = candidate.sku.toLowerCase();
  const description = candidate.description?.toLowerCase() ?? '';
  const needle = term.toLowerCase();

  if (!needle) return 0;
  if (sku === needle) return SKU_EXACT_SCORE;
  if (name === needle) return NAME_EXACT_SCORE;
  if (name.startsWith(needle)) return NAME_PREFIX_SCORE;
  if (name.includes(needle)) return NAME_CONTAINS_SCORE;
  if (sku.includes(needle)) return SKU_CONTAINS_SCORE;
  if (description.includes(needle)) return DESCRIPTION_CONTAINS_SCORE;
  return 0;
}

interface FuzzyProductRow {
  id: string;
  slug: string;
  name: string;
  sku: string;
  total: bigint;
}

@Injectable()
export class PrismaSearchLookupRepository implements SearchLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async searchProducts(
    terms: string[],
    page: number,
    pageSize: number,
  ): Promise<SearchProductsResult> {
    const candidates = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        deletedAt: null,
        OR: terms.flatMap((term) => [
          { name: { contains: term, mode: 'insensitive' } },
          { sku: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ]),
      },
      select: { id: true, slug: true, name: true, sku: true, description: true },
      take: CANDIDATE_POOL_SIZE,
    });

    const scored = candidates
      .map((candidate) => ({
        candidate,
        score: Math.max(...terms.map((term) => scoreProduct(candidate, term))),
      }))
      .sort((a, b) => b.score - a.score || a.candidate.name.localeCompare(b.candidate.name));

    const total = scored.length;
    const items: SearchResultItem[] = scored
      .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
      .map(({ candidate }) => ({
        id: candidate.id,
        slug: candidate.slug,
        name: candidate.name,
        sku: candidate.sku,
        type: SearchResultType.PRODUCT,
      }));

    return { items, total };
  }

  async searchProductsFuzzy(
    term: string,
    page: number,
    pageSize: number,
  ): Promise<SearchProductsResult> {
    const offset = (page - 1) * pageSize;
    // `word_similarity` (no `similarity`) porque compara el término contra la mejor sub-cadena de
    // palabras de `name`, no contra el nombre completo — imprescindible para nombres de varias
    // palabras ("Jersey Titan Rojo" vs. el typo "Jerzey": similarity() ≈ 0.19, word_similarity() ≈ 0.43).
    const rows = await this.prisma.$queryRaw<FuzzyProductRow[]>`
      SELECT id, slug, name, sku, COUNT(*) OVER() AS total
      FROM products
      WHERE status = 'ACTIVE' AND visibility = 'PUBLIC' AND "deletedAt" IS NULL
        AND word_similarity(${term}, name) > ${MIN_TRIGRAM_SIMILARITY}
      ORDER BY word_similarity(${term}, name) DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    return {
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        sku: row.sku,
        type: SearchResultType.PRODUCT,
      })),
      total: rows[0] ? Number(rows[0].total) : 0,
    };
  }

  async searchCategories(terms: string[], limit: number): Promise<SearchResultItem[]> {
    const rows = await this.prisma.category.findMany({
      where: {
        status: 'ACTIVE',
        OR: terms.flatMap((term) => [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ]),
      },
      select: { id: true, slug: true, name: true },
      take: limit,
    });
    return rows.map((row) => ({ ...row, type: SearchResultType.CATEGORY }));
  }

  async searchBrands(terms: string[], limit: number): Promise<SearchResultItem[]> {
    const rows = await this.prisma.brand.findMany({
      where: {
        status: 'ACTIVE',
        OR: terms.flatMap((term) => [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ]),
      },
      select: { id: true, slug: true, name: true },
      take: limit,
    });
    return rows.map((row) => ({ ...row, type: SearchResultType.BRAND }));
  }

  async searchCollections(terms: string[], limit: number): Promise<SearchResultItem[]> {
    const rows = await this.prisma.collection.findMany({
      where: {
        status: 'ACTIVE',
        OR: terms.flatMap((term) => [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ]),
      },
      select: { id: true, slug: true, name: true },
      take: limit,
    });
    return rows.map((row) => ({ ...row, type: SearchResultType.COLLECTION }));
  }

  async suggestProductNames(prefix: string, limit: number): Promise<SearchResultItem[]> {
    const rows = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        visibility: 'PUBLIC',
        deletedAt: null,
        name: { startsWith: prefix, mode: 'insensitive' },
      },
      select: { id: true, slug: true, name: true, sku: true },
      take: limit,
      orderBy: { name: 'asc' },
    });
    if (rows.length > 0) {
      return rows.map((row) => ({ ...row, type: SearchResultType.PRODUCT }));
    }

    const fuzzyRows = await this.prisma.$queryRaw<
      Array<{ id: string; slug: string; name: string; sku: string }>
    >`
      SELECT id, slug, name, sku
      FROM products
      WHERE status = 'ACTIVE' AND visibility = 'PUBLIC' AND "deletedAt" IS NULL
        AND word_similarity(${prefix}, name) > ${MIN_TRIGRAM_SIMILARITY}
      ORDER BY word_similarity(${prefix}, name) DESC
      LIMIT ${limit}
    `;
    return fuzzyRows.map((row) => ({ ...row, type: SearchResultType.PRODUCT }));
  }
}
