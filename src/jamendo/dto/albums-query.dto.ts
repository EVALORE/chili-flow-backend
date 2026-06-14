import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AlbumsQueryDto {
  @ApiPropertyOptional({ example: 'ambient' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  artistId?: string;

  @ApiPropertyOptional({ example: 'Chili Flow' })
  @IsOptional()
  @IsString()
  artistName?: string;

  @ApiPropertyOptional({ enum: ['album', 'single'], example: 'album' })
  @IsOptional()
  @IsIn(['album', 'single'])
  type?: 'album' | 'single';

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 20;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}
