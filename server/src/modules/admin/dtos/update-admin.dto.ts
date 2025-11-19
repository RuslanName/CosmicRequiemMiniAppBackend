import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class UpdateAdminDto {
    @IsNumber()
    @IsOptional()
    user_id?: number;

    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    password?: string;

    @IsBoolean()
    @IsOptional()
    is_system_admin?: boolean;
}

