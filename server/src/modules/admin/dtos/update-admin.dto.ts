import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdminDto {
  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  user_id?: number;

  @ApiProperty({ example: 'admin', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsString()
  @IsOptional()
  password?: string;
}
