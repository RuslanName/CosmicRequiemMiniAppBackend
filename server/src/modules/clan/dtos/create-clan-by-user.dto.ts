import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClanByUserDto {
  @ApiProperty({
    example: 123456789,
    description: 'ID сообщества VK',
  })
  @IsNumber()
  vk_group_id: number;
}
