import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
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
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { AdminJwtAuthGuard } from '../guards/admin-jwt-auth.guard';
import { ENV } from '../../../config/constants';
import { AdminLoginResponseDto } from '../dtos/responses/admin-login-response.dto';
import { LogoutResponseDto } from '../dtos/responses/logout-response.dto';

@ApiTags('Auth')
@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Вход в панель администрации' })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({
    status: 200,
    type: AdminLoginResponseDto,
  })
  @ApiResponse({
    status: 401,
  })
  async login(
    @Body() loginDto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminLoginResponseDto> {
    const { token: accessToken, refreshToken } =
      await this.adminAuthService.validateAdmin(loginDto);

    res.cookie('admin_access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('admin_refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      message: 'Вход выполнен успешно',
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Обновление access token администратора' })
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiResponse({
    status: 200,
    type: AdminLoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Неверный или истекший refresh токен',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminLoginResponseDto> {
    const refreshToken =
      refreshTokenDto.refreshToken ||
      (res.req.cookies?.['admin_refresh_token'] as string);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh токен не предоставлен');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await this.adminAuthService.refreshAdminTokens(refreshToken);

    res.cookie('admin_access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('admin_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      message: 'Токены успешно обновлены',
    };
  }

  @Post('logout')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Выход из панели администрации' })
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiResponse({
    status: 200,
    type: LogoutResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    const refreshToken =
      refreshTokenDto.refreshToken ||
      (res.req.cookies?.['admin_refresh_token'] as string);

    if (refreshToken) {
      await this.adminAuthService.revokeAdminRefreshToken(refreshToken);
    }

    res.clearCookie('admin_access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('admin_refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    return {
      success: true,
      message: 'Выход выполнен успешно',
    };
  }
}
