import { ApiProperty } from '@nestjs/swagger';
import { UserAccessoryResponseDto } from '../../../user-accessory/dtos/responses/user-accessory-response.dto';

export class UserRatingResponseDto {
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

  @ApiProperty()
  strength: number;

  @ApiProperty()
  guards_count: number;

  @ApiProperty({ required: false })
  rating_place?: number;

  @ApiProperty({
    type: [UserAccessoryResponseDto],
    required: false,
    nullable: true,
  })
  equipped_accessories?: UserAccessoryResponseDto[] | null;
}
