import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class AutocompleteQueryDto {
  @ApiProperty({ example: 'chil', minLength: 2 })
  @IsString()
  @MinLength(2)
  prefix!: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit = 5;

  @ApiPropertyOptional({
    enum: ['tracks', 'albums', 'artists', 'tags'],
    isArray: true,
    example: ['tracks', 'artists'],
    maxItems: 4,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }

    return typeof value === 'string' ? [value] : undefined;
  })
  @ArrayMaxSize(4)
  @IsIn(['tracks', 'albums', 'artists', 'tags'], { each: true })
  entity?: Array<'tracks' | 'albums' | 'artists' | 'tags'>;
}
