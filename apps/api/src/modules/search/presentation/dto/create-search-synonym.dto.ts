import { ArrayMaxSize, IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSearchSynonymDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  term!: string;

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  synonyms!: string[];
}
