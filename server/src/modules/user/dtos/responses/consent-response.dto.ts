import { ApiProperty } from '@nestjs/swagger';

export class FriendsAccessConsentResponseDto {
  @ApiProperty({ example: true })
  friends_access_consent: boolean;
}

export class GroupsAccessConsentResponseDto {
  @ApiProperty({ example: true })
  groups_access_consent: boolean;
}
