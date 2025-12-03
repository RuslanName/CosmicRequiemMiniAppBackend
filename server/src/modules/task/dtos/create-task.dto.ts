import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../enums/task-type.enum';

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: TaskType })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  value?: string | null;

  @ApiProperty()
  @IsInt()
  @Min(0)
  money_reward: number;
}
