import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class CreatePostDto {
  @IsString()
  @Length(1, 150)
  title!: string;

  @IsString()
  @Matches(SLUG_PATTERN, { message: 'slug debe contener solo minúsculas, números y guiones' })
  slug!: string;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  excerpt?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsUUID()
  authorId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 70)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  tagIds?: string[];
}
