import { ApiProperty } from '@nestjs/swagger';
import { UserTaskStatus } from '../../enums/user-task-status.enum';

export class TaskResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  description: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ nullable: true })
  value: string | null;

  @ApiProperty()
  money_reward: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class UserTaskResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  progress: number;

  @ApiProperty({ enum: UserTaskStatus })
  status: UserTaskStatus;

  @ApiProperty()
  task: TaskResponseDto;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

