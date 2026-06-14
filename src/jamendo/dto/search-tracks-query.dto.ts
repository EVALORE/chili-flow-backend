import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const toStringArray = ({ value }: { value: unknown }) => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return typeof value === 'string' ? [value] : undefined;
};

export class SearchTracksQueryDto {
  @ApiPropertyOptional({ example: 'night drive' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['electronic', 'ambient'],
    maxItems: 8,
  })
  @IsOptional()
  @Transform(toStringArray)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['chillout'],
    maxItems: 8,
  })
  @IsOptional()
  @Transform(toStringArray)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  fuzzyTags?: string[];

  @ApiPropertyOptional({
    enum: ['single', 'albumtrack'],
    isArray: true,
    example: ['single'],
    maxItems: 2,
  })
  @IsOptional()
  @Transform(toStringArray)
  @ArrayMaxSize(2)
  @IsIn(['single', 'albumtrack'], { each: true })
  type?: ('single' | 'albumtrack')[];

  @ApiPropertyOptional({
    enum: [
      'relevance',
      'popularity_total',
      'popularity_month',
      'downloads_total',
      'listens_total',
      'name',
    ],
    example: 'relevance',
  })
  @IsOptional()
  @IsIn([
    'relevance',
    'popularity_total',
    'popularity_month',
    'downloads_total',
    'listens_total',
    'name',
  ])
  order?:
    | 'relevance'
    | 'popularity_total'
    | 'popularity_month'
    | 'downloads_total'
    | 'listens_total'
    | 'name';

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
