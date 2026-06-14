import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateRecentlyPlayedDto {
  @ApiProperty({ enum: ['jamendo', 'uploaded'], example: 'jamendo' })
  @IsIn(['jamendo', 'uploaded'])
  source!: 'jamendo' | 'uploaded';

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  sourceId!: string;
}
