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
    example: 'Название клана',
    description: 'Название клана',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'https://vk.com/photo123456789_123456789',
    description: 'URL изображения клана',
  })
  @IsString()
  image_url: string;
}
