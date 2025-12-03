import { ApiProperty } from '@nestjs/swagger';

export class UserGuardAdminResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  strength: number;

  @ApiProperty()
  is_first: boolean;

  @ApiProperty()
  user_id: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

