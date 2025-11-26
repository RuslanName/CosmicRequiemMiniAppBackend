import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
    description: 'Сервер работает',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
        },
      },
    },
  })
  health() {
    return { status: 'ok' };
  }
}
