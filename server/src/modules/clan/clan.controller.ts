import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../../common/types/request.types';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Express } from 'express';
import { ClanService } from './clan.service';
import { CreateClanDto } from './dtos/create-clan.dto';
import { UpdateClanDto } from './dtos/update-clan.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { DeclareWarDto } from './dtos/declare-war.dto';
import { AttackEnemyDto } from './dtos/attack-enemy.dto';
import { User } from '../user/user.entity';
import { CreateClanApplicationDto } from './dtos/create-clan-application.dto';
import { ClanApplication } from './entities/clan-application.entity';
import {
  CacheTTL,
  CacheKey,
  InvalidateCache,
} from '../../common/decorators/cache.decorator';
import { ClanWithStatsResponseDto } from './dtos/responses/clan-with-stats-response.dto';
import { ClanWithReferralResponseDto } from './dtos/responses/clan-with-referral-response.dto';
import { ClanRatingResponseDto } from './dtos/responses/clan-rating-response.dto';
import { UserWithStatsResponseDto } from './dtos/responses/user-with-stats-response.dto';
import { AttackEnemyResponseDto } from './dtos/responses/attack-enemy-response.dto';
import { ClanWarResponseDto } from '../clan-war/dtos/responses/clan-war-response.dto';
import { CreateClanByUserDto } from './dtos/create-clan-by-user.dto';

@ApiTags('Clans')
@Controller('clans')
export class ClanController {
  constructor(private readonly clanService: ClanService) {}

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить все кланы с пагинацией' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: [ClanWithStatsResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanWithStatsResponseDto>> {
    return this.clanService.findAll(paginationDto);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('clan:public-list:page::page:limit::limit')
  @ApiOperation({ summary: 'Получить список кланов (Для Mini App)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: [ClanWithStatsResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getClansList(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanWithStatsResponseDto>> {
    return this.clanService.findAll(paginationDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('clan:me')
  @ApiOperation({
    summary: 'Получить клан текущего пользователя (Для Mini App)',
  })
  @ApiResponse({
    status: 200,
    type: ClanWithReferralResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не состоит в клане' })
  async getMyClan(
    @Request() req: AuthenticatedRequest,
  ): Promise<ClanWithReferralResponseDto> {
    return this.clanService.getUserClan(req.user.id);
  }

  @Get('me/wars')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(30)
  @CacheKey('clan:me:wars')
  @ApiOperation({
    summary:
      'Получить активные войны клана текущего пользователя (Для Mini App)',
  })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не состоит в клане' })
  async getMyClanWars(
    @Request() req: AuthenticatedRequest,
  ): Promise<ClanWarResponseDto[]> {
    const clan = await this.clanService.getUserClan(req.user.id);
    return this.clanService.getActiveWars(clan.id);
  }

  @Get('me/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить всех участников своего клана (Для Mini App)',
  })
  @ApiResponse({
    status: 200,
    type: [UserWithStatsResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не состоит в клане' })
  async getMyClanMembers(
    @Request() req: AuthenticatedRequest,
  ): Promise<UserWithStatsResponseDto[]> {
    const clan = await this.clanService.getUserClan(req.user.id);
    return this.clanService.getClanMembers(clan.id);
  }

  @Get('me/enemy-clans')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(30)
  @CacheKey('clan:me:enemy-clans')
  @ApiOperation({ summary: 'Получить кланы, с которыми война (Для Mini App)' })
  @ApiResponse({
    status: 200,
    type: [ClanWithStatsResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не состоит в клане' })
  async getEnemyClans(
    @Request() req: AuthenticatedRequest,
  ): Promise<ClanWithStatsResponseDto[]> {
    return this.clanService.getEnemyClans(req.user.id);
  }

  @Get('me/enemy-clans/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(30)
  @CacheKey('clan:me:enemy-clan')
  @ApiOperation({
    summary: 'Получить конкретный вражеский клан (Для Mini App)',
  })
  @ApiParam({ name: 'id', type: Number, example: 2 })
  @ApiResponse({
    status: 200,
    type: ClanWithStatsResponseDto,
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не состоит в клане или клан не найден',
  })
  async getEnemyClanById(
    @Request() req: AuthenticatedRequest,
    @Param('id') enemyClanId: string,
  ): Promise<ClanWithStatsResponseDto> {
    return this.clanService.getEnemyClanById(req.user.id, +enemyClanId);
  }

  @Get('me/enemy-clans/:id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(30)
  @ApiOperation({
    summary: 'Получить участников вражеского клана (Для Mini App)',
  })
  @ApiParam({ name: 'id', type: Number, example: 2 })
  @ApiResponse({
    status: 200,
    type: [UserWithStatsResponseDto],
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не состоит в клане или клан не найден',
  })
  async getEnemyClanMembersById(
    @Request() req: AuthenticatedRequest,
    @Param('id') enemyClanId: string,
  ): Promise<UserWithStatsResponseDto[]> {
    return this.clanService.getEnemyClanMembersById(req.user.id, +enemyClanId);
  }

  @Get('rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('clan:rating')
  @ApiOperation({ summary: 'Получить рейтинг кланов (Для Mini App)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: [ClanRatingResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getClanRating(
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanRatingResponseDto>> {
    return this.clanService.getClanRating(paginationDto);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('clan:search:query::query:page::page:limit::limit')
  @ApiOperation({ summary: 'Поиск кланов по названию (Для Mini App)' })
  @ApiQuery({
    name: 'query',
    required: true,
    type: String,
    description: 'Поисковый запрос',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: [ClanWithStatsResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async searchClans(
    @Query('query') query: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanWithStatsResponseDto>> {
    return this.clanService.searchClans(query, paginationDto);
  }

  @Get(':id/find')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('clan:find:id::id')
  @ApiOperation({ summary: 'Получить клан по ID (Для Mini App)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    type: ClanWithStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Клан не найден' })
  async findClanById(
    @Param('id') id: string,
  ): Promise<ClanWithStatsResponseDto> {
    return this.clanService.findOne(+id);
  }

  @Get(':id/find/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('clan:find:members:id::id')
  @ApiOperation({ summary: 'Получить участников клана по ID (Для Mini App)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    type: [UserWithStatsResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Клан не найден' })
  async findClanMembersById(
    @Param('id') id: string,
  ): Promise<UserWithStatsResponseDto[]> {
    return this.clanService.getClanMembers(+id);
  }

  @Get('wars/available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить доступные кланы для объявления войны (Для Mini App)',
  })
  @ApiResponse({
    status: 200,
    type: [ClanWithStatsResponseDto],
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не является лидером клана',
  })
  async getAvailableClansForWar(
    @Request() req: AuthenticatedRequest,
  ): Promise<ClanWithStatsResponseDto[]> {
    return this.clanService.getAvailableClansForWar(req.user.id);
  }

  @Post('wars/declare')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Объявить войну целевому клану (Для Mini App)' })
  @ApiBody({ type: DeclareWarDto })
  @ApiResponse({
    status: 201,
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Целевой клан не найден или пользователь не является лидером',
  })
  async declareWar(
    @Request() req: AuthenticatedRequest,
    @Body() declareWarDto: DeclareWarDto,
  ): Promise<ClanWarResponseDto> {
    return this.clanService.declareWar(
      req.user.id,
      declareWarDto.target_clan_id,
    );
  }

  @Get('wars/enemy-members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить участников вражеских кланов для атаки (Для Mini App)',
  })
  @ApiResponse({
    status: 200,
    type: [UserWithStatsResponseDto],
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getEnemyClanMembers(
    @Request() req: AuthenticatedRequest,
  ): Promise<UserWithStatsResponseDto[]> {
    return this.clanService.getEnemyClanMembers(req.user.id);
  }

  @Post('wars/attack')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Атаковать противника (Для Mini App)' })
  @ApiBody({ type: AttackEnemyDto })
  @ApiResponse({
    status: 200,
    type: AttackEnemyResponseDto,
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async attackEnemy(
    @Request() req: AuthenticatedRequest,
    @Body() attackEnemyDto: AttackEnemyDto,
  ): Promise<AttackEnemyResponseDto> {
    return this.clanService.attackEnemy(
      req.user.id,
      attackEnemyDto.target_user_id,
    );
  }

  @Post('leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Покинуть текущий клан (Для Mini App)' })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async leaveClan(@Request() req: AuthenticatedRequest): Promise<User> {
    return this.clanService.leaveClan(req.user.id);
  }

  @Post('application')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Создать заявку на вступление в клан (Для Mini App)',
  })
  @ApiBody({ type: CreateClanApplicationDto })
  @ApiResponse({
    status: 201,
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Клан или пользователь не найден' })
  async createApplication(
    @Request() req: AuthenticatedRequest,
    @Body() createClanApplicationDto: CreateClanApplicationDto,
  ): Promise<ClanApplication> {
    return this.clanService.createApplication(
      req.user.id,
      createClanApplicationDto.clan_id,
    );
  }

  @Get('application')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить список заявок на вступление в клан (Для Mini App)',
  })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не является лидером клана',
  })
  async getApplications(
    @Request() req: AuthenticatedRequest,
  ): Promise<ClanApplication[]> {
    return this.clanService.getApplications(req.user.id);
  }

  @Post('application/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Принять заявку на вступление в клан (Для Mini App)',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Заявка не найдена или пользователь не является лидером',
  })
  async acceptApplication(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ClanApplication> {
    return this.clanService.acceptApplication(req.user.id, +id);
  }

  @Post('application/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Отклонить заявку на вступление в клан (Для Mini App)',
  })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Заявка не найдена или пользователь не является лидером',
  })
  async rejectApplication(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<ClanApplication> {
    return this.clanService.rejectApplication(req.user.id, +id);
  }

  @Post('me/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Создать клан (Для Mini App)' })
  @ApiBody({ type: CreateClanByUserDto })
  @ApiResponse({
    status: 201,
    type: ClanWithReferralResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Пользователь уже состоит в клане или уже имеет клан',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async createClan(
    @Request() req: AuthenticatedRequest,
    @Body() createClanByUserDto: CreateClanByUserDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ClanWithReferralResponseDto> {
    return this.clanService.createClanByUser(
      req.user.id,
      createClanByUserDto,
      image,
    );
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @InvalidateCache('clan:me', 'clan:list:*')
  @ApiOperation({ summary: 'Удалить клан (Для Mini App)' })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Клан не найден или пользователь не является лидером',
  })
  async deleteClan(@Request() req: AuthenticatedRequest): Promise<void> {
    return this.clanService.deleteClanByLeader(req.user.id);
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить клан по ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    type: ClanWithStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Клан не найден' })
  async findOne(@Param('id') id: string): Promise<ClanWithStatsResponseDto> {
    return this.clanService.findOne(+id);
  }

  @Post()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Создать новый клан' })
  @ApiBody({ type: CreateClanDto })
  @ApiResponse({
    status: 201,
    type: ClanWithReferralResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(
    @Body() createClanDto: CreateClanDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<ClanWithReferralResponseDto> {
    return this.clanService.create(createClanDto, image);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Обновить клан' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateClanDto })
  @ApiResponse({
    status: 200,
    type: ClanWithReferralResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Клан не найден' })
  async update(
    @Param('id') id: string,
    @Body() updateClanDto: UpdateClanDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ClanWithReferralResponseDto> {
    return this.clanService.update(+id, updateClanDto, image);
  }

  @Delete(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Удалить клан' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Клан не найден' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.clanService.remove(+id);
  }
}
