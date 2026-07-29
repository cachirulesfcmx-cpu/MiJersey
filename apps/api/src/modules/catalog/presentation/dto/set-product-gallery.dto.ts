import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class SetProductGalleryDto {
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  mediaIds!: string[];
}
