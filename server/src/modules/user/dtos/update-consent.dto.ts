import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFriendsAccessConsentDto {
  @ApiProperty({
    example: true,
    description: 'Согласие на получение списка друзей для атаки',
  })
  @IsBoolean()
  friends_access_consent: boolean;
}

export class UpdateGroupsAccessConsentDto {
  @ApiProperty({
    example: true,
    description: 'Согласие на получение списка своих групп',
  })
  @IsBoolean()
  groups_access_consent: boolean;
}
