import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlaylistResponseDto {
  @ApiProperty({ example: '7d2e1fd7-3e0b-43a3-8db7-2f6e25783e3f' })
  id!: string;

  @ApiProperty({ example: '7d2e1fd7-3e0b-43a3-8db7-2f6e25783e3f' })
  ownerId!: string;

  @ApiProperty({ example: 'Road Trip' })
  name!: string;

  @ApiPropertyOptional({ example: 'Songs for the road', nullable: true })
  description!: string | null;

  @ApiProperty({ example: '2026-06-14T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-14T10:00:00.000Z' })
  updatedAt!: Date;
}

export class PlaylistSummaryResponseDto {
  @ApiProperty({ example: '7d2e1fd7-3e0b-43a3-8db7-2f6e25783e3f' })
  id!: string;

  @ApiProperty({ example: 'Road Trip' })
  name!: string;

  @ApiPropertyOptional({ example: 'Songs for the road', nullable: true })
  description!: string | null;

  @ApiProperty({
    example: 12,
    description: 'Number of playlist item rows in this playlist.',
  })
  itemCount!: number;

  @ApiProperty({ example: 2568 })
  totalDuration!: number;

  @ApiProperty({ example: '2026-06-14T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-14T10:00:00.000Z' })
  updatedAt!: Date;
}

export class PlaylistItemResponseDto {
  @ApiProperty({
    example: '7d2e1fd7-3e0b-43a3-8db7-2f6e25783e3f',
    description:
      'Playlist item row ID. Use this ID for delete and reorder operations.',
  })
  id!: string;

  @ApiProperty({ example: '7d2e1fd7-3e0b-43a3-8db7-2f6e25783e3f' })
  playlistId!: string;

  @ApiProperty({
    enum: ['jamendo', 'uploaded'],
    example: 'jamendo',
    description:
      'Backing source type for this playlist item snapshot. Jamendo is an external catalog track; uploaded is a local uploaded track.',
  })
  source!: 'jamendo' | 'uploaded';

  @ApiProperty({
    example: '123456',
    description:
      'Backing source ID used when the item was created. This is not the playlist item ID.',
  })
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

  @ApiProperty({ example: 0 })
  position!: number;

  @ApiProperty({ example: '2026-06-14T10:00:00.000Z' })
  addedAt!: Date;
}

export class PlaylistDetailResponseDto extends PlaylistResponseDto {
  @ApiProperty({
    example: 12,
    description: 'Number of playlist item rows in this playlist.',
  })
  itemCount!: number;

  @ApiProperty({ example: 2568 })
  totalDuration!: number;

  @ApiProperty({ type: [PlaylistItemResponseDto] })
  items!: PlaylistItemResponseDto[];
}
