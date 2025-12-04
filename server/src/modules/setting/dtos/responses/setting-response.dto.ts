import { ApiProperty } from '@nestjs/swagger';

export class SettingResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  key: string;

  @ApiProperty()
  value: string;
}
