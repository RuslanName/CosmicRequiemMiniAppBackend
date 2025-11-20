import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AdminAuthService } from '../services/admin-auth.service';
import { AdminLoginDto } from '../dtos/admin-login.dto';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { ENV } from '../../../config/constants';

@ApiTags('Auth')
@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Вход в панель администрации',
    description:
      'Аутентифицирует администратора и устанавливает токен в HTTP-only cookie',
  })
  @ApiBody({
    schema: {
      example: {
        username: '123456789',
        password: 'your_password',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Успешная аутентификация',
    schema: {
      example: {
        success: true,
        message: 'Login successful',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
  async login(
    @Body() loginDto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean; message: string }> {
    const { token } = await this.adminAuthService.validateAdmin(loginDto);

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: ENV.MODE === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      message: 'Login successful',
    };
  }

  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Выход из панели администрации' })
  @ApiResponse({ status: 200, description: 'Успешный выход' })
  logout(@Res({ passthrough: true }) res: Response): {
    success: boolean;
    message: string;
  } {
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: ENV.MODE === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return {
      success: true,
      message: 'Logout successful',
    };
  }
}
