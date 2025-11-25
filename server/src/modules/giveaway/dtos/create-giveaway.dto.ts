import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGiveawayDto {
  @ApiProperty({ example: 'Конкурс на лучшего игрока месяца' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://vk.com/contest' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ required: false, example: '/images/giveaway.jpg' })
  @IsOptional()
  @IsString()
  image_path?: string | null;
}
