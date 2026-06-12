import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateRecentlyPlayedDto {
  @IsIn(['jamendo', 'uploaded'])
  source!: 'jamendo' | 'uploaded';

  @IsString()
  @IsNotEmpty()
  sourceId!: string;
}
