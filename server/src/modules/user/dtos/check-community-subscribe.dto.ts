import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckCommunitySubscribeDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  task_id: number;
}
