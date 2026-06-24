import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class CreatePlaylistItemDto {
  @ApiProperty({
    enum: ['jamendo', 'uploaded'],
    example: 'jamendo',
    description:
      'Backing source for the playlist item. Jamendo sources are external catalog tracks; uploaded sources are local uploaded tracks owned by the authenticated user.',
  })
  @IsIn(['jamendo', 'uploaded'])
  source!: 'jamendo' | 'uploaded';

  @ApiProperty({
    example: '123456',
    description:
      'Backing source ID. For source "jamendo", this is a Jamendo catalog track ID. For source "uploaded", this is a local uploaded-track ID.',
  })
  @IsString()
  sourceId!: string;
}
