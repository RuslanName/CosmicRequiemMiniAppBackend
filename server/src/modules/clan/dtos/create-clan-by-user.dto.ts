import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClanByUserDto {
  @ApiProperty({
    example: 123456789,
    description: 'ID сообщества VK',
  })
  @IsNumber()
  vk_group_id: number;

  @ApiProperty({
    example: 'https://vk.com/club123456789',
    description: 'URL сообщества VK',
  })
  @IsString()
  group_url: string;
}
