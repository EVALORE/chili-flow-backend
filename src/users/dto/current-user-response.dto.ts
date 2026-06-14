import { ApiProperty } from '@nestjs/swagger';

export class CurrentUserResponseDto {
  @ApiProperty({ example: '7d2e1fd7-3e0b-43a3-8db7-2f6e25783e3f' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;
}
