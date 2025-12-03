import { ApiProperty } from '@nestjs/swagger';

export class GiveawayResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  url: string;

  @ApiProperty({ nullable: true })
  image_path: string | null;
}

