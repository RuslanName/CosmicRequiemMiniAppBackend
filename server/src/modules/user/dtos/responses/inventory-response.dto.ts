import { ApiProperty } from '@nestjs/swagger';
import { UserBoostResponseDto } from '../../../user-boost/dtos/user-boost-response.dto';
import { UserAccessoryResponseDto } from '../../../user-accessory/dtos/user-accessory-response.dto';

export class InventoryResponseDto {
  @ApiProperty({ type: [UserBoostResponseDto] })
  boosts: UserBoostResponseDto[];

  @ApiProperty({ type: [UserAccessoryResponseDto] })
  accessories: UserAccessoryResponseDto[];

  @ApiProperty({ required: false })
  total?: number;

  @ApiProperty({ required: false })
  page?: number;

  @ApiProperty({ required: false })
  limit?: number;
}
