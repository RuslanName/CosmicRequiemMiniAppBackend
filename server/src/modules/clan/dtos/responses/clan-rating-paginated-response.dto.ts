import { ApiProperty } from '@nestjs/swagger';
import { ClanRatingResponseDto } from './clan-rating-response.dto';

export class ClanRatingPaginatedResponseDto {
  @ApiProperty({ type: [ClanRatingResponseDto] })
  data: ClanRatingResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ required: false, nullable: true })
  my_rating_place?: number | null;
}
