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
} from '@nestjs/common';
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
import {
  CacheTTL,
  CacheKey,
  InvalidateCache,
} from '../../common/decorators/cache.decorator';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { EquipAccessoryDto } from '../user-accessory/dtos/equip-accessory.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @CacheTTL(60)
  @CacheKey('user:list')
  @ApiOperation({ summary: 'Получить всех пользователей с пагинацией' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список пользователей с пагинацией',
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
  ): Promise<{
    data: (User & { strength: number; referral_link?: string })[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.userService.findAll(paginationDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить текущего аутентифицированного пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращает текущего пользователя с силой',
  })
  async findMe(
    @Request() req,
  ): Promise<User & { strength: number; referral_link?: string }> {
    return this.userService.findMe(req.user.id);
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @CacheTTL(120)
  @CacheKey('user::id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiResponse({ status: 200, description: 'Возвращает пользователя с силой' })
  async findOne(
    @Param('id') id: string,
  ): Promise<User & { strength: number; referral_link?: string }> {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @InvalidateCache('user::id', 'user:list')
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает обновленного пользователя',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(+id, updateUserDto);
  }

  @Post('training')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Тренировка стражей пользователя',
    description:
      'Тренирует всех стражей пользователя, увеличивая их силу. Стоимость зависит от текущей общей силы. Проверяет кулдаун TRAINING_COOLDOWN (15 минут) и наличие достаточного количества денег.',
  })
  @ApiResponse({
    status: 200,
    description: 'Тренировка успешно завершена',
    schema: {
      example: {
        user: { id: 1, money: 4500 },
        training_cost: 500,
        power_increase: 25,
        new_power: 275,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Недостаточно денег, кулдаун тренировки активен, нет стражей для тренировки',
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async training(
    @Request() req,
  ): Promise<{
    user: User;
    training_cost: number;
    power_increase: number;
    new_power: number;
  }> {
    return this.userService.training(req.user.id);
  }

  @Post('contract')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Выполнить контракт для заработка денег',
    description:
      'Выполняет контракт для заработка виртуальной валюты. Доход рассчитывается на основе текущей силы пользователя (55% от стоимости тренировки). Проверяет кулдаун CONTRACT_COOLDOWN (15 минут).',
  })
  @ApiResponse({
    status: 200,
    description: 'Контракт успешно выполнен',
    schema: {
      example: {
        user: { id: 1, money: 5500 },
        contract_income: 275,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Кулдаун контракта активен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async contract(
    @Request() req,
  ): Promise<{ user: User; contract_income: number }> {
    return this.userService.contract(req.user.id);
  }

  @Get('rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('user:rating')
  @ApiOperation({ summary: 'Получить рейтинг пользователей' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество элементов на странице',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Возвращает рейтинг пользователей',
  })
  async getRating(
    @Query() paginationDto: PaginationDto,
  ): Promise<{
    data: (User & { strength: number })[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.userService.getRating(paginationDto);
  }

  @Get('me/boosts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить бусты текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список бустов',
  })
  async getMyBoosts(@Request() req): Promise<UserBoost[]> {
    return this.userService.getUserBoosts(req.user.id);
  }

  @Get('me/accessories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить аксессуары текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список аксессуаров',
  })
  async getMyAccessories(@Request() req): Promise<UserAccessory[]> {
    return this.userService.getUserAccessories(req.user.id);
  }

  @Get('me/equipped-accessories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить надетые аксессуары пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список надетых аксессуаров',
  })
  async getEquippedAccessories(@Request() req): Promise<UserAccessory[]> {
    return this.userService.getEquippedAccessories(req.user.id);
  }

  @Post('equip-accessory')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Надеть аксессуар' })
  @ApiBody({ type: EquipAccessoryDto })
  @ApiResponse({
    status: 200,
    description: 'Аксессуар успешно надет',
  })
  @ApiResponse({
    status: 400,
    description: 'Аксессуар не принадлежит пользователю',
  })
  @ApiResponse({ status: 404, description: 'Аксессуар не найден' })
  async equipAccessory(
    @Request() req,
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
  @ApiOperation({ summary: 'Снять аксессуар' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID аксессуара',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Аксессуар успешно снят',
  })
  @ApiResponse({
    status: 400,
    description: 'Аксессуар не принадлежит пользователю или уже снят',
  })
  @ApiResponse({ status: 404, description: 'Аксессуар не найден' })
  async unequipAccessory(
    @Request() req,
    @Param('id') id: string,
  ): Promise<UserAccessory> {
    return this.userService.unequipAccessory(req.user.id, +id);
  }
}
