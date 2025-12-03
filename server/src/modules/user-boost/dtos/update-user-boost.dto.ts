import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserBoostDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsDateString()
  end_time?: Date;
}
