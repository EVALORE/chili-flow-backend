import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class ReorderPlaylistTracksDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  trackIds!: string[];
}
