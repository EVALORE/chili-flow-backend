import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadTrackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  artist!: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  genre?: string;
}
