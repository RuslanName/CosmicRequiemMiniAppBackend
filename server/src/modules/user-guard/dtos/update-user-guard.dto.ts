import { IsOptional, IsString, IsNumber, IsBoolean, Min } from 'class-validator';

export class UpdateUserGuardDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  strength?: number;

  @IsOptional()
  @IsBoolean()
  is_first?: boolean;

  @IsOptional()
  @IsNumber()
  user_id?: number;
}
