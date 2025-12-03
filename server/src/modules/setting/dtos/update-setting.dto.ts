import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  value?: string;
}
