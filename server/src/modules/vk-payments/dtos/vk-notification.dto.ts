import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VKNotificationDto {
  @ApiProperty({ example: 'get_item' })
  @IsString()
  notification_type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  item_id?: string;

  @ApiProperty({ required: false, description: 'Альтернативное поле для item_id (VK может отправлять item вместо item_id)' })
  @IsOptional()
  @IsString()
  item?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  order_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  app_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  item_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sig?: string;
}
