import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class UpdateUserGuardDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  strength?: number;

  @IsOptional()
  @IsBoolean()
  is_first?: boolean;

  @IsOptional()
  @IsNumber()
  user_id?: number;
}

