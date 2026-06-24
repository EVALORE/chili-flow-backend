import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadedTrackResponseDto {
  @ApiProperty({ example: '7d2e1fd7-3e0b-43a3-8db7-2f6e25783e3f' })
  id!: string;

  @ApiProperty({ example: 'Night Drive' })
  title!: string;

  @ApiProperty({ example: 'Chili Flow' })
  artist!: string;

  @ApiPropertyOptional({ example: 'Electronic', nullable: true })
  genre!: string | null;

  @ApiProperty({ example: 'http://localhost:3000/uploads/night-drive.mp3' })
  publicUrl!: string;

  @ApiPropertyOptional({ example: 214, nullable: true })
  duration!: number | null;

  @ApiProperty({ example: '2026-06-14T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-14T10:00:00.000Z' })
  updatedAt!: Date;
}
