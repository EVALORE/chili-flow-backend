import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateRecentlyPlayedDto {
  @ApiProperty({
    enum: ['jamendo', 'uploaded'],
    example: 'jamendo',
    description:
      'Backing source for the playback event. Jamendo sources are external catalog tracks; uploaded sources are local uploaded tracks owned by the authenticated user.',
  })
  @IsIn(['jamendo', 'uploaded'])
  source!: 'jamendo' | 'uploaded';

  @ApiProperty({
    example: '123456',
    description:
      'Backing source ID. For source "jamendo", this is a Jamendo catalog track ID. For source "uploaded", this is a local uploaded-track ID. Recently played entries snapshot source metadata at creation time.',
  })
  @IsString()
  @IsNotEmpty()
  sourceId!: string;
}
