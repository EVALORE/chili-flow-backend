import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecentlyPlayedResponseDto {
  @ApiProperty({ example: '7d2e1fd7-3e0b-43a3-8db7-2f6e25783e3f' })
  id!: string;

  @ApiProperty({ enum: ['jamendo', 'uploaded'], example: 'jamendo' })
  source!: 'jamendo' | 'uploaded';

  @ApiProperty({ example: '123456' })
  sourceId!: string;

  @ApiProperty({ example: 'Night Drive' })
  title!: string;

  @ApiProperty({ example: 'Chili Flow' })
  artist!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/audio.mp3',
    nullable: true,
  })
  audioUrl!: string | null;

  @ApiPropertyOptional({ example: 214, nullable: true })
  duration!: number | null;

  @ApiProperty({ example: '2026-06-14T10:00:00.000Z' })
  playedAt!: Date;
}
