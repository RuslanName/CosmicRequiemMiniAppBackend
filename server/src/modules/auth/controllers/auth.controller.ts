import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { AuthDto } from '../dtos/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @ApiOperation({
    summary: 'Аутентификация пользователя и получение JWT токена',
    description:
      'Аутентифицирует пользователя через VK и возвращает JWT токен. Если пользователь не существует, создает нового с базовым стражем. Проверяет подпись VK для безопасности.',
  })
  @ApiBody({
    schema: {
      example: {
        user: {
          id: 123456789,
          first_name: 'John',
          last_name: 'Doe',
          sex: 2,
          photo_max_orig: 'https://example.com/photo.jpg',
        },
        sign: 'vk_signature_hash',
        vk_params: {
          vk_user_id: '123456789',
          vk_app_id: '12345',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Успешная аутентификация',
    schema: {
      example: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверная подпись VK' })
  async login(@Body() authDto: AuthDto): Promise<{ token: string }> {
    const token = await this.authService.validateAuth(authDto);
    return { token };
  }
}
