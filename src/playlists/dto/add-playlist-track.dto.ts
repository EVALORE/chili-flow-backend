import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class AddPlaylistTrackDto {
  @ApiProperty({ enum: ['jamendo', 'uploaded'], example: 'jamendo' })
  @IsIn(['jamendo', 'uploaded'])
  source!: 'jamendo' | 'uploaded';

  @ApiProperty({ example: '123456' })
  @IsString()
  sourceId!: string;
}
