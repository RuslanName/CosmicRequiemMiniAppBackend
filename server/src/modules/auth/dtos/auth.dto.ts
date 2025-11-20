import { IsObject, IsString } from 'class-validator';

export class AuthDto {
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

  @IsString()
  sign: string;

  @IsObject()
  vk_params: Record<string, string>;
}
