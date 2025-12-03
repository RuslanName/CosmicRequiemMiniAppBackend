import { ApiProperty } from '@nestjs/swagger';

export class SubscribeCommunityResponseDto {
  @ApiProperty()
  subscribed: boolean;
}
