import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  limit?: number = 10;
}
