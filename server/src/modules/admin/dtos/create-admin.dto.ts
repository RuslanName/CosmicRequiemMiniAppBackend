import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateAdminDto {
    @IsNumber()
    user_id: number;

    @IsString()
    username: string;

    @IsString()
    password: string;

    @IsBoolean()
    @IsOptional()
    is_system_admin?: boolean;
}

