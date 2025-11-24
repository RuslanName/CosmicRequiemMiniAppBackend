import { ApiProperty } from '@nestjs/swagger';

export class UserGuardResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  strength: number;

  @ApiProperty()
  is_first: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

