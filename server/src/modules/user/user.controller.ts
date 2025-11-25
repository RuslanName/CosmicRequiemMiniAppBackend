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
    type: [UserWithBasicStatsResponseDto],
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
  @ApiOperation({ summary: 'Тренировка стражей пользователя (Для Mini App)' })
  @ApiBody({ required: false })
  @ApiResponse({
    status: 200,
    type: TrainingResponseDto,
  })
  @ApiResponse({
    status: 400,
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
  })
  @ApiBody({ required: false })
  @ApiResponse({
    status: 200,
    type: ContractResponseDto,
  })
  @ApiResponse({
    status: 400,
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
  @ApiOperation({ summary: 'Получить рейтинг пользователей (Для Mini App)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: [UserRatingResponseDto],
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
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    enum: ['top', 'suitable', 'friends'],
    example: 'top',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: [UserRatingResponseDto],
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getAttackableUsers(
    @Request() req: AuthenticatedRequest,
    @Query('filter') filter?: 'top' | 'suitable' | 'friends',
    @Query() paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<UserRatingResponseDto>> {
    if (filter && !['top', 'suitable', 'friends'].includes(filter)) {
      throw new BadRequestException(
        'Filter parameter must be one of: top, suitable, friends',
      );
    }
    return this.userService.getAttackableUsers(
      req.user.id,
      filter,
      paginationDto,
    );
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    type: UserWithBasicStatsResponseDto,
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
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(+id, updateUserDto);
  }

  @Get('me/inventory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Получить инвентарь текущего пользователя (бусты и аксессуары) (Для Mini App)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    type: InventoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getInventory(
    @Request() req: AuthenticatedRequest,
    @Query() paginationDto?: PaginationDto,
  ): Promise<InventoryResponseDto> {
    return this.userService.getInventory(req.user.id, paginationDto);
  }

  @Get('me/guards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить стражей текущего пользователя (Для Mini App)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
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
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Аксессуар не найден' })
  async equipAccessory(
    @Request() req: AuthenticatedRequest,
    @Body() equipAccessoryDto: EquipAccessoryDto,
  ): Promise<UserAccessory> {
    return this.userService.equipAccessory(
      req.user.id,
      equipAccessoryDto.accessory_id,
    );
  }

  @Post('unequip-accessory/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Снять аксессуар (Для Mini App)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
  })
  @ApiResponse({
    status: 400,
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Аксессуар не найден' })
  async unequipAccessory(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<UserAccessory> {
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
  })
  @ApiResponse({
    status: 400,
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
    type: [EventHistoryItemResponseDto],
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
}
