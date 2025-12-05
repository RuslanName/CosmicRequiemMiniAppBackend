import { ApiProperty } from '@nestjs/swagger';
import { UserRatingResponseDto } from './user-rating-response.dto';

export class UserRatingPaginatedResponseDto {
  @ApiProperty({ type: [UserRatingResponseDto] })
  data: UserRatingResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ required: false, nullable: true })
  my_rating_place?: number | null;
}
