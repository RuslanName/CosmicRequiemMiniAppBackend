import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateUserGuardDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  strength?: number;

  @IsBoolean()
  @IsOptional()
  is_first?: boolean;

  @IsNumber()
  user_id: number;
}
