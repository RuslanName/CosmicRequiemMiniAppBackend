import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserGuardDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({
    required: false,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  strength?: number;

  @ApiProperty({
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_first?: boolean;

  @ApiProperty()
  @IsNumber()
  user_id: number;
}
