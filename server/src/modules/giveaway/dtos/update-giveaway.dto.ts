import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGiveawayDto {
  @ApiProperty({ required: false, example: 'Конкурс на лучшего игрока месяца' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'https://vk.com/contest' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ required: false, example: '/images/giveaway.jpg' })
  @IsOptional()
  @IsString()
  image_path?: string | null;
}
