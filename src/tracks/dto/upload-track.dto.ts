import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadTrackDto {
  @ApiProperty({ example: 'Night Drive', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @ApiProperty({ example: 'Chili Flow', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  artist!: string;

  @ApiPropertyOptional({ example: 'Electronic', maxLength: 80 })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  genre?: string;
}
