import { IsIn, IsString } from 'class-validator';

export class AddPlaylistTrackDto {
  @IsIn(['jamendo', 'uploaded'])
  source!: 'jamendo' | 'uploaded';

  @IsString()
  sourceId!: string;
}
