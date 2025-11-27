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
  HttpCode,
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
    type: PaginatedResponseDto<ClanWithStatsResponseDto>,
    description: 'Список кланов с пагинацией',
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
    type: PaginatedResponseDto<ClanWithStatsResponseDto>,
    description: 'Список кланов с пагинацией',
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
    description:
      'Возвращает информацию о клане текущего пользователя. Включает поле has_active_wars (boolean), указывающее наличие активных войн.',
  })
  @ApiResponse({
    status: 200,
    type: ClanWithReferralResponseDto,
    description:
      'Информация о клане с полем has_active_wars, указывающим наличие активных войн',
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
  @CacheKey('clan:me:wars:page::page:limit::limit')
  @ApiOperation({
    summary:
      'Получить все войны клана текущего пользователя с пагинацией (Для Mini App)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<ClanWarResponseDto>,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не состоит в клане' })
  async getMyClanWars(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanWarResponseDto>> {
    const clan = await this.clanService.getUserClan(req.user.id);
    return this.clanService.getAllWars(clan.id, paginationDto);
  }

  @Get('me/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить всех участников своего клана (Для Mini App)',
    description:
      'Возвращает список участников клана, отсортированных по силе и деньгам (от самых крутых к менее крутым). Сортировка: strength * 1000 + money',
  })
  @ApiResponse({
    status: 200,
    type: [UserWithStatsResponseDto],
    description:
      'Список участников клана, отсортированных по силе и деньгам (от самых крутых к менее крутым)',
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
  @ApiOperation({
    summary: 'Получить кланы, с которыми война (Для Mini App)',
    description:
      'Возвращает список кланов, с которыми у текущего клана активная война. Каждый клан включает поля war_start_time и war_end_time.',
  })
  @ApiResponse({
    status: 200,
    type: [ClanWithStatsResponseDto],
    description:
      'Список вражеских кланов с полями war_start_time и war_end_time',
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
    description:
      'Возвращает информацию о конкретном вражеском клане с полями war_start_time и war_end_time',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 2,
    description: 'ID вражеского клана',
  })
  @ApiResponse({
    status: 200,
    type: ClanWithStatsResponseDto,
    description:
      'Информация о вражеском клане с полями war_start_time и war_end_time',
  })
  @ApiResponse({
    status: 400,
    description: 'Клан не является вражеским или война не активна',
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
    description:
      'Возвращает список участников вражеского клана, отсортированных по силе и деньгам (от самых крутых к менее крутым). Сортировка: strength * 1000 + money',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 2,
    description: 'ID вражеского клана',
  })
  @ApiResponse({
    status: 200,
    type: [UserWithStatsResponseDto],
    description:
      'Список участников вражеского клана, отсортированных по силе и деньгам (от самых крутых к менее крутым)',
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
  @ApiOperation({
    summary: 'Получить рейтинг кланов (Для Mini App)',
    description:
      'Возвращает рейтинг кланов, отсортированных по силе и деньгам (от самых крутых к менее крутым). Сортировка: strength * 1000 + money, затем по рейтингу (wins)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<ClanRatingResponseDto>,
    description:
      'Рейтинг кланов, отсортированных по силе и деньгам (от самых крутых к менее крутым)',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getClanRating(
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanRatingResponseDto>> {
    return this.clanService.getClanRating(paginationDto);
  }

  @Get(':id/find')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('clan:find:id::id:query::query')
  @ApiOperation({
    summary: 'Получить клан по ID или найти по названию (Для Mini App)',
    description:
      'Если указан query, выполняет поиск кланов по названию с пагинацией. Если query не указан, возвращает клан по ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'ID клана (используется только если query не указан)',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description:
      'Поисковый запрос по названию (если указан, поиск будет по названию, а не по ID)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Клан по ID или список кланов по названию с пагинацией',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/ClanWithStatsResponseDto' },
        { $ref: '#/components/schemas/PaginatedResponseDto' },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Клан не найден' })
  async findClanById(
    @Param('id') id: string,
    @Query('query') query?: string,
    @Query() paginationDto?: PaginationDto,
  ): Promise<
    ClanWithStatsResponseDto | PaginatedResponseDto<ClanWithStatsResponseDto>
  > {
    if (query) {
      return this.clanService.searchClans(query, paginationDto);
    }
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
    description:
      'Возвращает список кланов, которым можно объявить войну (нет активной войны, кулдаун прошел и т.д.)',
  })
  @ApiResponse({
    status: 200,
    type: [ClanWithStatsResponseDto],
    description: 'Список доступных кланов для объявления войны',
  })
  @ApiResponse({
    status: 400,
    description: 'Невозможно получить список (кулдаун активен и т.д.)',
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

  @Post('me/declare-war')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Объявить войну целевому клану (Для Mini App)',
    description:
      'Объявляет войну целевому клану. Доступно только для лидера клана.',
  })
  @ApiBody({ type: DeclareWarDto })
  @ApiResponse({
    status: 201,
    type: ClanWarResponseDto,
    description: 'Война успешно объявлена',
  })
  @ApiResponse({
    status: 400,
    description:
      'Невозможно объявить войну (кулдаун активен, достигнут лимит войн и т.д.)',
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

  @Post('me/enemy-clans/:id/attack')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Атаковать противника из вражеского клана (Для Mini App)',
    description:
      'Атакует указанного пользователя из вражеского клана. Параметр :id - это ID вражеского клана, в теле запроса указывается target_user_id.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 2,
    description: 'ID вражеского клана',
  })
  @ApiBody({
    type: AttackEnemyDto,
    description: 'ID целевого пользователя для атаки',
  })
  @ApiResponse({
    status: 200,
    type: AttackEnemyResponseDto,
    description: 'Результат атаки',
  })
  @ApiResponse({
    status: 400,
    description:
      'Невозможно атаковать (кулдаун активен, нет активной войны, пользователь не из указанного клана и т.д.)',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async attackEnemy(
    @Request() req: AuthenticatedRequest,
    @Param('id') enemyClanId: string,
    @Body() attackEnemyDto: AttackEnemyDto,
  ): Promise<AttackEnemyResponseDto> {
    return this.clanService.attackEnemy(
      req.user.id,
      attackEnemyDto.target_user_id,
      +enemyClanId,
    );
  }

  @Post('me/leave')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Покинуть текущий клан (Для Mini App)' })
  @ApiResponse({
    status: 200,
    type: User,
    description: 'Пользователь успешно покинул клан',
  })
  @ApiResponse({
    status: 400,
    description: 'Пользователь не состоит в клане или является лидером',
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
    type: ClanApplication,
    description: 'Заявка успешно создана',
  })
  @ApiResponse({
    status: 400,
    description: 'Пользователь уже состоит в клане или заявка уже существует',
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
    description:
      'Возвращает список заявок на вступление в клан текущего пользователя',
  })
  @ApiResponse({
    status: 200,
    type: [ClanApplication],
    description: 'Список заявок на вступление в клан',
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
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'ID заявки' })
  @ApiResponse({
    status: 200,
    type: ClanApplication,
    description: 'Заявка успешно принята',
  })
  @ApiResponse({
    status: 400,
    description: 'Заявка уже обработана или клан переполнен',
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
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'ID заявки' })
  @ApiResponse({
    status: 200,
    type: ClanApplication,
    description: 'Заявка успешно отклонена',
  })
  @ApiResponse({
    status: 400,
    description: 'Заявка уже обработана',
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
    description: 'Клан успешно удален',
  })
  @ApiResponse({
    status: 400,
    description: 'Невозможно удалить клан (есть активные войны и т.д.)',
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
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'ID клана' })
  @ApiResponse({
    status: 200,
    type: ClanWithStatsResponseDto,
    description: 'Информация о клане',
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
    description: 'Клан успешно создан',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
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
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'ID клана' })
  @ApiBody({ type: UpdateClanDto })
  @ApiResponse({
    status: 200,
    type: ClanWithReferralResponseDto,
    description: 'Клан успешно обновлен',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
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
  @ApiParam({ name: 'id', type: Number, example: 1, description: 'ID клана' })
  @ApiResponse({
    status: 200,
    description: 'Клан успешно удален',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Клан не найден' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.clanService.remove(+id);
  }
}
