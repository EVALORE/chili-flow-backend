import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogTrackResponseDto {
  @ApiProperty({ example: 'jamendo' })
  source!: 'jamendo';

  @ApiProperty({ example: '123456' })
  sourceId!: string;

  @ApiProperty({ example: 'Night Drive' })
  title!: string;

  @ApiProperty({ example: 'Chili Flow' })
  artist!: string;

  @ApiProperty({ example: '7890' })
  artistId!: string;

  @ApiPropertyOptional({ example: 'Late Sessions', nullable: true })
  album!: string | null;

  @ApiPropertyOptional({ example: '456789', nullable: true })
  albumId!: string | null;

  @ApiProperty({ example: 214 })
  duration!: number;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiProperty({ example: 'https://example.com/audio.mp3' })
  audioUrl!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/download.mp3',
    nullable: true,
  })
  downloadUrl!: string | null;

  @ApiProperty({ example: 'https://www.jamendo.com/track/123456' })
  shareUrl!: string;

  @ApiPropertyOptional({
    example: 'https://creativecommons.org/licenses/by/3.0/',
    nullable: true,
  })
  licenseUrl!: string | null;

  @ApiProperty({ example: true })
  audiodownloadAllowed!: boolean;
}

export class CatalogTrackListResponseDto {
  @ApiProperty({ example: 42 })
  count!: number;

  @ApiProperty({ type: [CatalogTrackResponseDto] })
  results!: CatalogTrackResponseDto[];
}

export class CatalogAlbumResponseDto {
  @ApiProperty({ example: 'jamendo' })
  source!: 'jamendo';

  @ApiProperty({ example: '456789' })
  sourceId!: string;

  @ApiProperty({ example: 'Late Sessions' })
  title!: string;

  @ApiProperty({ example: 'Chili Flow' })
  artist!: string;

  @ApiProperty({ example: '7890' })
  artistId!: string;

  @ApiPropertyOptional({ example: '2026-06-14', nullable: true })
  releaseDate!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/album.zip',
    nullable: true,
  })
  zipUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://www.jamendo.com/album/456789',
    nullable: true,
  })
  shareUrl!: string | null;

  @ApiProperty({ example: true })
  zipAllowed!: boolean;

  @ApiPropertyOptional({ example: 10, nullable: true })
  trackCount!: number | null;
}

export class CatalogAlbumTrackResponseDto {
  @ApiProperty({ example: 'jamendo' })
  source!: 'jamendo';

  @ApiProperty({ example: '123456' })
  sourceId!: string;

  @ApiProperty({ example: 'Night Drive' })
  title!: string;

  @ApiProperty({ example: 'Chili Flow' })
  artist!: string;

  @ApiProperty({ example: '7890' })
  artistId!: string;

  @ApiProperty({ example: 'Late Sessions' })
  album!: string;

  @ApiProperty({ example: '456789' })
  albumId!: string;

  @ApiProperty({ example: 1 })
  position!: number;

  @ApiProperty({ example: 214 })
  duration!: number;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiProperty({ example: 'https://example.com/audio.mp3' })
  audioUrl!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/download.mp3',
    nullable: true,
  })
  downloadUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://www.jamendo.com/album/456789',
    nullable: true,
  })
  shareUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://creativecommons.org/licenses/by/3.0/',
    nullable: true,
  })
  licenseUrl!: string | null;

  @ApiProperty({ example: true })
  audiodownloadAllowed!: boolean;
}

export class CatalogAlbumWithTracksResponseDto {
  @ApiProperty({ example: 'jamendo' })
  source!: 'jamendo';

  @ApiProperty({ example: '456789' })
  sourceId!: string;

  @ApiProperty({ example: 'Late Sessions' })
  title!: string;

  @ApiProperty({ example: 'Chili Flow' })
  artist!: string;

  @ApiProperty({ example: '7890' })
  artistId!: string;

  @ApiPropertyOptional({ example: '2026-06-14', nullable: true })
  releaseDate!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/album.zip',
    nullable: true,
  })
  zipUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://www.jamendo.com/album/456789',
    nullable: true,
  })
  shareUrl!: string | null;

  @ApiProperty({ example: true })
  zipAllowed!: boolean;

  @ApiProperty({ example: 10 })
  trackCount!: number;

  @ApiProperty({ type: [CatalogAlbumTrackResponseDto] })
  tracks!: CatalogAlbumTrackResponseDto[];
}

export class CatalogAlbumListResponseDto {
  @ApiProperty({ example: 42 })
  count!: number;

  @ApiProperty({ type: [CatalogAlbumResponseDto] })
  results!: CatalogAlbumResponseDto[];
}

export class CatalogArtistResponseDto {
  @ApiProperty({ example: 'jamendo' })
  source!: 'jamendo';

  @ApiProperty({ example: '7890' })
  sourceId!: string;

  @ApiProperty({ example: 'Chili Flow' })
  name!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/artist.jpg',
    nullable: true,
  })
  imageUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://artist.example.com',
    nullable: true,
  })
  websiteUrl!: string | null;

  @ApiPropertyOptional({ example: '2026-06-14', nullable: true })
  joinDate!: string | null;

  @ApiPropertyOptional({
    example: 'https://www.jamendo.com/artist/7890',
    nullable: true,
  })
  shareUrl!: string | null;
}

export class CatalogArtistListResponseDto {
  @ApiProperty({ example: 42 })
  count!: number;

  @ApiProperty({ type: [CatalogArtistResponseDto] })
  results!: CatalogArtistResponseDto[];
}

export class CatalogAutocompleteMatchResponseDto {
  @ApiProperty({ example: 'Chili Flow' })
  label!: string;

  @ApiPropertyOptional({ example: 12, nullable: true })
  count!: number | null;
}

export class CatalogAutocompleteResponseDto {
  @ApiProperty({ type: [CatalogAutocompleteMatchResponseDto] })
  tracks!: CatalogAutocompleteMatchResponseDto[];

  @ApiProperty({ type: [CatalogAutocompleteMatchResponseDto] })
  albums!: CatalogAutocompleteMatchResponseDto[];

  @ApiProperty({ type: [CatalogAutocompleteMatchResponseDto] })
  artists!: CatalogAutocompleteMatchResponseDto[];

  @ApiProperty({ type: [CatalogAutocompleteMatchResponseDto] })
  tags!: CatalogAutocompleteMatchResponseDto[];
}

export class CatalogPlaylistResponseDto {
  @ApiProperty({ example: 'jamendo' })
  source!: 'jamendo';

  @ApiProperty({ example: '123456' })
  sourceId!: string;

  @ApiProperty({ example: 'Late Night Drive' })
  title!: string;

  @ApiPropertyOptional({ example: 'Jamendo User', nullable: true })
  author!: string | null;

  @ApiPropertyOptional({ example: '7890', nullable: true })
  authorId!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://www.jamendo.com/playlist/123456',
    nullable: true,
  })
  shareUrl!: string | null;

  @ApiPropertyOptional({ example: '2026-06-14', nullable: true })
  createdAt!: string | null;

  @ApiPropertyOptional({ example: 25, nullable: true })
  trackCount!: number | null;
}

export class CatalogPlaylistWithTracksResponseDto {
  @ApiProperty({ example: 'jamendo' })
  source!: 'jamendo';

  @ApiProperty({ example: '123456' })
  sourceId!: string;

  @ApiProperty({ example: 'Late Night Drive' })
  title!: string;

  @ApiPropertyOptional({ example: 'Jamendo User', nullable: true })
  author!: string | null;

  @ApiPropertyOptional({ example: '7890', nullable: true })
  authorId!: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiPropertyOptional({
    example: 'https://www.jamendo.com/playlist/123456',
    nullable: true,
  })
  shareUrl!: string | null;

  @ApiPropertyOptional({ example: '2026-06-14', nullable: true })
  createdAt!: string | null;

  @ApiProperty({ example: 25 })
  trackCount!: number;

  @ApiProperty({ type: [CatalogTrackResponseDto] })
  tracks!: CatalogTrackResponseDto[];
}

export class CatalogPlaylistListResponseDto {
  @ApiProperty({ example: 42 })
  count!: number;

  @ApiProperty({ type: [CatalogPlaylistResponseDto] })
  results!: CatalogPlaylistResponseDto[];
}
