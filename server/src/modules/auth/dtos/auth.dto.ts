import { IsObject, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty()
  @IsObject()
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    photo_200?: string;
    photo_max_orig?: string;
    bdate?: string;
    bdate_visibility?: number;
    sex?: number;
  };

  @ApiProperty()
  @IsString()
  sign: string;

  @ApiProperty()
  @IsObject()
  vk_params: Record<string, string>;
}
