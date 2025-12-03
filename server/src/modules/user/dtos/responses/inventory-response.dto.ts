import { ApiProperty } from '@nestjs/swagger';
import { UserBoostResponseDto } from '../../../user-boost/dtos/responses/user-boost-response.dto';
import { UserAccessoryResponseDto } from '../../../user-accessory/dtos/responses/user-accessory-response.dto';

export class AccessoriesCategoryResponseDto {
  @ApiProperty({ type: [UserAccessoryResponseDto] })
  data: UserAccessoryResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class InventoryResponseDto {
  @ApiProperty({ type: [UserBoostResponseDto] })
  boosts: UserBoostResponseDto[];

  @ApiProperty({ type: AccessoriesCategoryResponseDto })
  accessories: Record<string, AccessoriesCategoryResponseDto>;
}
