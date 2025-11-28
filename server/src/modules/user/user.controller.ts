import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Request,
  Query,
  Post,
  BadRequestException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../../common/types/request.types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { CacheTTL, CacheKey } from '../../common/decorators/cache.decorator';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { EquipAccessoryDto } from '../user-accessory/dtos/equip-accessory.dto';
import { AttackPlayerDto } from './dtos/attack-player.dto';
import { ActivateShieldDto } from './dtos/activate-shield.dto';
import { UserWithBasicStatsResponseDto } from './dtos/responses/user-with-basic-stats-response.dto';
import { UserMeResponseDto } from './dtos/responses/user-me-response.dto';
import { UserRatingResponseDto } from './dtos/responses/user-rating-response.dto';
import { UserGuardResponseDto } from '../user-guard/dtos/responses/user-guard-response.dto';
import { TrainingResponseDto } from './dtos/responses/training-response.dto';
import { ContractResponseDto } from './dtos/responses/contract-response.dto';
import { AttackPlayerResponseDto } from './dtos/responses/attack-player-response.dto';
import { InventoryResponseDto } from './dtos/responses/inventory-response.dto';
import { EventHistoryItemResponseDto } from './dtos/responses/event-history-item-response.dto';
import { UserAccessoryService } from '../user-accessory/user-accessory.service';
import { ActivateShieldResponseDto } from './dtos/responses/activate-shield-response.dto';
import { UserAccessoryResponseDto } from '../user-accessory/dtos/user-accessory-response.dto';
import { UserTasksResponseDto } from './dtos/responses/user-tasks-response.dto';
import { CheckCommunitySubscribeDto } from './dtos/check-community-subscribe.dto';
import { GetFriendsDto } from './dtos/get-friends.dto';
import {
  UpdateFriendsAccessConsentDto,
  UpdateGroupsAccessConsentDto,
} from './dtos/update-consent.dto';
import {
  FriendsAccessConsentResponseDto,
  GroupsAccessConsentResponseDto,
} from './dtos/responses/consent-response.dto';
import { CommunitySubscribeResponseDto } from './dtos/responses/community-subscribe-response.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userAccessoryService: UserAccessoryService,
  ) {}

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить всех пользователей с пагинацией' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<UserWithBasicStatsResponseDto>,
    description: 'Список пользователей с пагинацией',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UserWithBasicStatsResponseDto>> {
    return this.userService.findAll(paginationDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Получить текущего аутентифицированного пользователя (Для Mini App)',
  })
  @ApiResponse({
    status: 200,
    type: UserMeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async findMe(
    @Request() req: AuthenticatedRequest,
  ): Promise<UserMeResponseDto> {
    return this.userService.findMe(req.user.id);
  }

  @Post('training')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Тренировка стражей пользователя (Для Mini App)',
    description:
      'Тренирует стражей пользователя, увеличивая их силу. Проверяет кулдауны тренировки и контракта (нельзя выполнять одновременно). Для первого стража применяется ограничение max_strength_first_user_guard.',
  })
  @ApiBody({ required: false })
  @ApiResponse({
    status: 200,
    type: TrainingResponseDto,
    description: 'Тренировка успешно выполнена',
  })
  @ApiResponse({
    status: 400,
    description:
      'Кулдаун активен, недостаточно средств или превышено ограничение силы первого стража',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async training(
    @Request() req: AuthenticatedRequest,
  ): Promise<TrainingResponseDto> {
    return this.userService.training(req.user.id);
  }

  @Post('contract')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Выполнить контракт для заработка денег (Для Mini App)',
    description:
      'Выполняет контракт для заработка денег. Проверяет кулдауны контракта и тренировки (нельзя выполнять одновременно).',
  })
  @ApiBody({ required: false })
  @ApiResponse({
    status: 200,
    type: ContractResponseDto,
    description: 'Контракт успешно выполнен',
  })
  @ApiResponse({
    status: 400,
    description: 'Кулдаун активен или недостаточно средств',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async contract(
    @Request() req: AuthenticatedRequest,
  ): Promise<ContractResponseDto> {
    return this.userService.contract(req.user.id);
  }

  @Get('rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('user:rating')
  @ApiOperation({
    summary: 'Получить рейтинг пользователей (Для Mini App)',
    description:
      'Возвращает рейтинг пользователей, отсортированных по силе и деньгам (от самых крутых к менее крутым). Сортировка: strength * 1000 + money',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<UserRatingResponseDto>,
    description:
      'Рейтинг пользователей, отсортированных по силе и деньгам (от самых крутых к менее крутым)',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getRating(
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<UserRatingResponseDto>> {
    return this.userService.getRating(paginationDto);
  }

  @Get('attackable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('user:attackable::user')
  @ApiOperation({
    summary: 'Получить список пользователей для атаки (Для Mini App)',
    description:
      'Возвращает список пользователей для атаки. Фильтры: top - все пользователи, suitable - подходящие по силе, friends - друзья из VK, зарегистрированные в системе. Сортировка: strength * 1000 + money (от самых крутых к менее крутым). Для suitable сначала сортировка по близости к текущей силе, затем по силе и деньгам.',
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['top', 'suitable', 'friends'],
    example: 'top',
    description:
      'Фильтр: top - все пользователи, suitable - подходящие по силе, friends - друзья',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<UserRatingResponseDto>,
    description: 'Список пользователей для атаки с пагинацией',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверный фильтр',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getAttackableUsers(
    @Request() req: AuthenticatedRequest,
    @Query('filter') filter?: 'top' | 'suitable' | 'friends',
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<UserRatingResponseDto>> {
    if (filter && !['top', 'suitable', 'friends'].includes(filter)) {
      throw new BadRequestException(
        'Параметр фильтра должен быть одним из: top, suitable, friends',
      );
    }
    return this.userService.getAttackableUsers(
      req.user.id,
      filter,
      paginationDto,
    );
  }

  @Post('attackable/friends')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить список друзей для атаки по VK ID (Для Mini App)',
    description:
      'Принимает список VK ID друзей, полученных через VK Bridge, и возвращает только тех, кто зарегистрирован в системе и доступен для атаки.',
  })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<UserRatingResponseDto>,
    description: 'Список друзей для атаки с пагинацией',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getAttackableFriends(
    @Request() req: AuthenticatedRequest,
    @Body() getFriendsDto: GetFriendsDto,
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<UserRatingResponseDto>> {
    return this.userService.getAttackableFriendsByVkIds(
      req.user.id,
      getFriendsDto.friend_vk_ids,
      paginationDto,
    );
  }

  @Patch('me/friends-access-consent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновить согласие на получение списка друзей (Для Mini App)',
    description:
      'Обновляет согласие пользователя на получение списка друзей для функционала атаки.',
  })
  @ApiBody({ type: UpdateFriendsAccessConsentDto })
  @ApiResponse({
    status: 200,
    type: FriendsAccessConsentResponseDto,
    description: 'Согласие успешно обновлено',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async updateFriendsAccessConsent(
    @Request() req: AuthenticatedRequest,
    @Body() updateConsentDto: UpdateFriendsAccessConsentDto,
  ): Promise<FriendsAccessConsentResponseDto> {
    return this.userService.updateFriendsAccessConsent(
      req.user.id,
      updateConsentDto.friends_access_consent,
    );
  }

  @Patch('me/groups-access-consent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Обновить согласие на получение списка групп (Для Mini App)',
    description:
      'Обновляет согласие пользователя на получение списка своих групп для функционала создания клана.',
  })
  @ApiBody({ type: UpdateGroupsAccessConsentDto })
  @ApiResponse({
    status: 200,
    type: GroupsAccessConsentResponseDto,
    description: 'Согласие успешно обновлено',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async updateGroupsAccessConsent(
    @Request() req: AuthenticatedRequest,
    @Body() updateConsentDto: UpdateGroupsAccessConsentDto,
  ): Promise<GroupsAccessConsentResponseDto> {
    return this.userService.updateGroupsAccessConsent(
      req.user.id,
      updateConsentDto.groups_access_consent,
    );
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'ID пользователя',
  })
  @ApiResponse({
    status: 200,
    type: UserWithBasicStatsResponseDto,
    description: 'Информация о пользователе',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async findOne(
    @Param('id') id: string,
  ): Promise<UserWithBasicStatsResponseDto> {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'ID пользователя',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    type: UserWithBasicStatsResponseDto,
    description: 'Пользователь успешно обновлен',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserWithBasicStatsResponseDto> {
    return this.userService.update(+id, updateUserDto);
  }

  @Get('me/inventory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Получить инвентарь текущего пользователя (бусты и аксессуары) (Для Mini App)',
    description:
      'Пагинация: используйте `page` и `limit` для всех категорий аксессуаров, или `{category}_page` и `{category}_limit` для конкретной категории (например: `nickname_color_page=1&nickname_color_limit=10`)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Общий номер страницы для всех категорий аксессуаров',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Общий лимит для всех категорий аксессуаров',
  })
  @ApiQuery({
    name: '{category}_page',
    required: false,
    type: Number,
    description:
      'Номер страницы для конкретной категории (например: nickname_color_page=1)',
  })
  @ApiQuery({
    name: '{category}_limit',
    required: false,
    type: Number,
    description:
      'Лимит для конкретной категории (например: nickname_color_limit=10)',
  })
  @ApiResponse({
    status: 200,
    type: InventoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getInventory(
    @Request() req: AuthenticatedRequest,
    @Query() query: any,
  ): Promise<InventoryResponseDto> {
    return this.userService.getInventory(req.user.id, query);
  }

  @Get('me/guards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить стражей текущего пользователя (Для Mini App)',
    description:
      'Возвращает список стражей пользователя с пагинацией, отсортированных по силе (от самых сильных к менее сильным)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<UserGuardResponseDto>,
    description:
      'Список стражей, отсортированных по силе (от самых сильных к менее сильным)',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getMyGuards(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<UserGuardResponseDto>> {
    return this.userService.getUserGuards(req.user.id, paginationDto);
  }

  @Post('equip-accessory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Надеть аксессуар (Для Mini App)' })
  @ApiBody({ type: EquipAccessoryDto })
  @ApiResponse({
    status: 200,
    type: UserAccessoryResponseDto,
    description: 'Аксессуар успешно надет',
  })
  @ApiResponse({
    status: 400,
    description: 'Аксессуар уже надет или неверные данные',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Аксессуар не найден' })
  async equipAccessory(
    @Request() req: AuthenticatedRequest,
    @Body() equipAccessoryDto: EquipAccessoryDto,
  ): Promise<UserAccessoryResponseDto> {
    return this.userService.equipAccessory(
      req.user.id,
      equipAccessoryDto.accessory_id,
    );
  }

  @Post('unequip-accessory/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Снять аксессуар (Для Mini App)' })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'ID аксессуара для снятия',
  })
  @ApiResponse({
    status: 200,
    type: UserAccessoryResponseDto,
    description: 'Аксессуар успешно снят',
  })
  @ApiResponse({
    status: 400,
    description: 'Аксессуар не надет',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Аксессуар не найден' })
  async unequipAccessory(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<UserAccessoryResponseDto> {
    return this.userService.unequipAccessory(req.user.id, +id);
  }

  @Post('attack')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Атаковать игрока (Для Mini App)' })
  @ApiBody({ type: AttackPlayerDto })
  @ApiResponse({
    status: 200,
    type: AttackPlayerResponseDto,
    description: 'Результат атаки',
  })
  @ApiResponse({
    status: 400,
    description:
      'Невозможно атаковать (кулдаун активен, щит активен, недостаточно силы и т.д.)',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async attackPlayer(
    @Request() req: AuthenticatedRequest,
    @Body() attackPlayerDto: AttackPlayerDto,
  ): Promise<AttackPlayerResponseDto> {
    return this.userService.attackPlayer(
      req.user.id,
      attackPlayerDto.target_user_id,
    );
  }

  @Get('me/event-history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(30)
  @ApiOperation({
    summary: 'Получить историю событий пользователя (Для Mini App)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: PaginatedResponseDto<EventHistoryItemResponseDto>,
    description: 'История событий пользователя с пагинацией',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getEventHistory(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<EventHistoryItemResponseDto>> {
    return this.userService.getEventHistory(req.user.id, paginationDto);
  }

  @Post('me/activate-shield')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Активировать щит из инвентаря (Для Mini App)' })
  @ApiBody({ type: ActivateShieldDto })
  @ApiResponse({
    status: 200,
    description: 'Щит успешно активирован',
    type: ActivateShieldResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка активации щита',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Аксессуар не найден' })
  async activateShield(
    @Request() req: AuthenticatedRequest,
    @Body() activateShieldDto: ActivateShieldDto,
  ): Promise<ActivateShieldResponseDto> {
    return this.userAccessoryService.activateShield(
      req.user.id,
      activateShieldDto.accessory_id,
    );
  }

  @Get('me/tasks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить задания текущего пользователя (Для Mini App)',
  })
  @ApiResponse({
    status: 200,
    type: UserTasksResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getTasks(
    @Request() req: AuthenticatedRequest,
  ): Promise<UserTasksResponseDto> {
    return this.userService.getUserTasks(req.user.id);
  }

  @Post('me/check-community-subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Проверить подписку на сообщество и обновить прогресс задания (Для Mini App)',
    description:
      'Проверяет подписку пользователя на сообщество VK по задаче. Принимает task_id, находит задачу типа COMMUNITY_SUBSCRIBE, берет community_id из task.value и проверяет подписку. Если пользователь подписан, обновляет прогресс задачи.',
  })
  @ApiBody({
    type: CheckCommunitySubscribeDto,
    description: 'ID задачи (task_id) для проверки подписки',
  })
  @ApiResponse({
    status: 200,
    type: CommunitySubscribeResponseDto,
    description: 'Проверка выполнена',
  })
  @ApiResponse({
    status: 400,
    description:
      'Задача не является типом COMMUNITY_SUBSCRIBE или значение community_id не установлено',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден или задача не найдена',
  })
  async checkCommunitySubscribe(
    @Request() req: AuthenticatedRequest,
    @Body() checkCommunitySubscribeDto: CheckCommunitySubscribeDto,
  ): Promise<CommunitySubscribeResponseDto> {
    return this.userService.checkCommunitySubscribe(
      req.user.id,
      checkCommunitySubscribeDto.task_id,
    );
  }
}
