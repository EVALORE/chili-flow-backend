export class UploadedTrackResponseDto {
  id!: string;
  title!: string;
  artist!: string;
  genre!: string | null;
  publicUrl!: string;
  duration!: number | null;
  createdAt!: Date;
  updatedAt!: Date;
}
