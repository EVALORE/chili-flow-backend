import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderPlaylistTracksDto {
  @ApiProperty({
    example: [
      '7d2e1fd7-3e0b-43a3-8db7-2f6e25783e3f',
      '2c30f38c-2f2d-407c-8ad5-f1fcb4041a9d',
    ],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  trackIds!: string[];
}
