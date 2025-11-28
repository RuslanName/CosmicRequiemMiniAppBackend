import { ApiProperty } from '@nestjs/swagger';

export class CommunitySubscribeResponseDto {
  @ApiProperty({ example: true })
  subscribed: boolean;
}
