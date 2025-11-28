import { ApiProperty } from '@nestjs/swagger';
import { LeaderResponseDto } from './leader-response.dto';

export class ClanWithReferralResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  max_members: number;

  @ApiProperty()
  image_path: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ type: () => LeaderResponseDto, required: false })
  leader?: LeaderResponseDto;

  @ApiProperty({ required: false, nullable: true })
  leader_id?: number | null;

  @ApiProperty({ required: false })
  money?: number;

  @ApiProperty({ required: false })
  strength?: number;

  @ApiProperty({ required: false })
  power?: number;

  @ApiProperty({ required: false })
  guards_count?: number;

  @ApiProperty({ required: false })
  members_count?: number;

  @ApiProperty({ required: false })
  referral_link?: string;

  @ApiProperty({ required: false })
  wars_count?: number;

  @ApiProperty({ required: false })
  has_active_wars?: boolean;
}
