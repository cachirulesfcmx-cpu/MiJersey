import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

/** Blog Home (sin filtros), Category Archive (`category`) y Tag Archive (`tag`) comparten el mismo endpoint público — mismo criterio que la extensión del motor de búsqueda con `scope` (014). */
export class ListPublishedPostsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}
