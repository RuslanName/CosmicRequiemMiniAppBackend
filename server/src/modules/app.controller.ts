import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthResponseDto } from './app/dtos/responses/health-response.dto';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({
    summary: 'Проверка работоспособности сервера',
    description: 'Используется для проверки доступности API',
  })
  @ApiResponse({
    status: 200,
    type: HealthResponseDto,
    description: 'Сервер работает',
  })
  health(): HealthResponseDto {
    return { status: 'ok' };
  }
}
