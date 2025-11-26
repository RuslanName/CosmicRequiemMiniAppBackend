import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckCommunitySubscribeDto {
  @ApiProperty({
    example: 1,
    description:
      'ID задачи (task_id). Задача должна быть типа COMMUNITY_SUBSCRIBE, в поле value должен быть указан community_id',
  })
  @IsNumber()
  @IsNotEmpty()
  task_id: number;
}
