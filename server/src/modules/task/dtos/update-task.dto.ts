import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskType } from '../enums/task-type.enum';

export class UpdateTaskDto {
  @ApiProperty({ required: false, example: 'Выполните 5 контрактов' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    enum: TaskType,
    example: TaskType.COMPLETE_CONTRACT,
  })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiProperty({
    required: false,
    example: '5',
    description: 'Количество раз для выполнения (опционально)',
  })
  @IsOptional()
  @IsString()
  value?: string | null;

  @ApiProperty({
    required: false,
    example: 1000,
    description: 'Денежная награда',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  money_reward?: number;
}
