import { ApiProperty } from '@nestjs/swagger';
import { UserAccessoryResponseDto } from '../../../user-accessory/dtos/user-accessory-response.dto';

class GuardAsUserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  vk_id: number;

  @ApiProperty()
  first_name: string;

  @ApiProperty({ required: false, nullable: true })
  last_name?: string | null;

  @ApiProperty({ required: false, nullable: true })
  image_path?: string | null;

  @ApiProperty({ type: [UserAccessoryResponseDto] })
  equipped_accessories: UserAccessoryResponseDto[];
}

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

  @ApiProperty({ type: () => GuardAsUserDto, required: false, nullable: true })
  guard_as_user?: GuardAsUserDto | null;
}
