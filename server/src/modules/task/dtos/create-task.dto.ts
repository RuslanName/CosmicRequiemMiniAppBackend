import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../enums/task-type.enum';

export class CreateTaskDto {
  @ApiProperty({ example: 'Выполните 5 контрактов' })
  @IsString()
  description: string;

  @ApiProperty({ enum: TaskType, example: TaskType.COMPLETE_CONTRACT })
  @IsEnum(TaskType)
  type: TaskType;

  @ApiProperty({
    required: false,
    example: '5',
    description: 'Количество раз для выполнения (опционально)',
  })
  @IsOptional()
  @IsString()
  value?: string | null;

  @ApiProperty({ example: 1000, description: 'Денежная награда' })
  @IsInt()
  @Min(0)
  money_reward: number;
}
