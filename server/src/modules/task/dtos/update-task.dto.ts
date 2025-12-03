import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../enums/task-type.enum';

export class UpdateTaskDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    enum: TaskType,
  })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  value?: string | null;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  money_reward?: number;
}
