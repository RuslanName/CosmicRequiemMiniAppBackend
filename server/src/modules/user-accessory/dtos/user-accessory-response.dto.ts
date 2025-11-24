import { ApiProperty } from '@nestjs/swagger';
import { UserAccessoryStatus } from '../enums/user-accessory-status.enum';

export class UserAccessoryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserAccessoryStatus })
  status: UserAccessoryStatus;

  @ApiProperty()
  type: string;

  @ApiProperty({ nullable: true })
  value: string | null;

  @ApiProperty({ nullable: true })
  image_path: string | null;

  @ApiProperty()
  created_at: Date;
}

