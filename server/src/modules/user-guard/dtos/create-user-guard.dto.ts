import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateUserGuardDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  strength?: number;

  @IsBoolean()
  @IsOptional()
  is_first?: boolean;

  @IsNumber()
  user_id: number;
}
