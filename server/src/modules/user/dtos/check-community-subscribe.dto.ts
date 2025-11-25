import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckCommunitySubscribeDto {
  @ApiProperty({
    example: '12345678',
    description: 'ID сообщества VK (без минуса)',
  })
  @IsString()
  @IsNotEmpty()
  community_id: string;
}
