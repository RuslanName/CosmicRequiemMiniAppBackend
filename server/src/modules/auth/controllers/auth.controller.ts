import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Logger,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { AuthDto } from '../dtos/auth.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { ProcessReferralDto } from '../dtos/process-referral.dto';
import { AuthLoginResponseDto } from '../dtos/responses/auth-login-response.dto';
import { LogoutResponseDto } from '../dtos/responses/logout-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../../common/types/request.types';
import { ENV } from '../../../config/constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @ApiOperation({
    summary:
      'Аутентификация пользователя и получение JWT токенов (Для Mini App)',
  })
  @ApiBody({ type: AuthDto })
  @ApiResponse({
    status: 200,
    type: AuthLoginResponseDto,
  })
  @ApiResponse({
    status: 401,
  })
  async login(
    @Body() authDto: AuthDto,
    @Req() req: ExpressRequest,
    @Query() query: Record<string, any>,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLoginResponseDto> {
    const { accessToken, refreshToken } =
      await this.authService.validateAuth(authDto);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Обновление access token с помощью refresh token (Для Mini App)',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    type: AuthLoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Неверный или истекший refresh токен',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLoginResponseDto> {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
    );

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: ENV.MODE === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: ENV.MODE === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Выход из системы и отзыв refresh token (Для Mini App)',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    type: LogoutResponseDto,
    description: 'Выход выполнен успешно',
  })
  async logout(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutResponseDto> {
    await this.authService.revokeRefreshToken(refreshTokenDto.refreshToken);

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: ENV.MODE === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: ENV.MODE === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return {
      success: true,
      message: 'Выход выполнен успешно',
    };
  }

  @Post('referral')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обработка реферальной ссылки',
  })
  @ApiBody({ type: ProcessReferralDto })
  @ApiResponse({
    status: 200,
    description: 'Реферальная ссылка обработана',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async processReferral(
    @Request() req: AuthenticatedRequest,
    @Body() processReferralDto: ProcessReferralDto,
  ): Promise<{ success: boolean; message: string; referrerId?: number }> {
    return await this.authService.processReferral(
      req.user.id,
      processReferralDto.referral_link_id,
    );
  }
}
