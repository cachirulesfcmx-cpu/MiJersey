import { IsString, Length, Matches } from 'class-validator';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class CreateBlogTagDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsString()
  @Matches(SLUG_PATTERN, { message: 'slug debe contener solo minúsculas, números y guiones' })
  slug!: string;
}
