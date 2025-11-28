import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAdminGroupsDto {
  @ApiProperty({
    example: 'vk1.a.xxx...',
    description: 'VK access token пользователя для получения списка групп',
    required: false,
  })
  @IsOptional()
  @IsString()
  vk_access_token?: string;
}
