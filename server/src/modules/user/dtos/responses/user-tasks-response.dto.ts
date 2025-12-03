import { ApiProperty } from '@nestjs/swagger';
import { UserTaskResponseDto } from '../../../task/dtos/responses/user-task-response.dto';

export class UserTasksResponseDto {
  @ApiProperty({ type: [UserTaskResponseDto] })
  tasks: UserTaskResponseDto[];
}
