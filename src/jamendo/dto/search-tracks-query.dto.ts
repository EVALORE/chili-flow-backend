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
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(toStringArray)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  fuzzyTags?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @ArrayMaxSize(2)
  @IsIn(['single', 'albumtrack'], { each: true })
  type?: ('single' | 'albumtrack')[];

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}
