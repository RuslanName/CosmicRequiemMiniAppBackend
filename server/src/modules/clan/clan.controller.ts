import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth, ApiConsumes, ApiCookieAuth } from '@nestjs/swagger';
import { Express } from 'express';
import { ClanService } from './clan.service';
import { Clan } from './entities/clan.entity';
import { CreateClanDto } from './dtos/create-clan.dto';
import { UpdateClanDto } from './dtos/update-clan.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';
import { DeclareWarDto } from './dtos/declare-war.dto';
import { AttackEnemyDto } from './dtos/attack-enemy.dto';
import { ClanWar } from '../clan-war/entities/clan-war.entity';
import { User } from '../user/user.entity';
import { CreateClanApplicationDto } from './dtos/create-clan-application.dto';
import { ClanApplication } from './entities/clan-application.entity';
import { CacheTTL, CacheKey, InvalidateCache } from '../../common/decorators/cache.decorator';

@ApiTags('Clan')
@Controller('clans')
export class ClanController {
  constructor(private readonly clanService: ClanService) {}

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @CacheTTL(60)
  @CacheKey('clan:list')
  @ApiOperation({ 
    summary: 'Получить все кланы с пагинацией',
    description: 'Возвращает список всех кланов с поддержкой пагинации. Можно указать параметры page и limit для управления количеством результатов.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (по умолчанию 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество элементов на странице (по умолчанию 10)', example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Успешно возвращен список кланов',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Elite Warriors',
            max_members: 50,
            status: 'active',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
          }
        ],
        total: 100,
        page: 1,
        limit: 10
      }
    }
  })
  async findAll(@Query() paginationDto: PaginationDto): Promise<{ data: Clan[]; total: number; page: number; limit: number }> {
    return this.clanService.findAll(paginationDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('clan:me')
  @ApiOperation({ 
    summary: 'Получить клан текущего пользователя',
    description: 'Возвращает полную информацию о клане текущего авторизованного пользователя, включая список участников и лидера.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Успешно возвращен клан',
    schema: {
      example: {
        id: 1,
        name: 'Elite Warriors',
        max_members: 50,
        status: 'active',
        members: [],
        leader: { id: 1, first_name: 'John' },
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не состоит в клане' })
  async getMyClan(@Request() req): Promise<Clan> {
    return this.clanService.getUserClan(req.user.id);
  }

  @Get('me/wars')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(30)
  @CacheKey('clan:me:wars')
  @ApiOperation({ 
    summary: 'Получить активные войны клана текущего пользователя',
    description: 'Возвращает список всех активных войн клана текущего авторизованного пользователя.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список активных войн',
    schema: {
      example: [
        {
          id: 1,
          clan_1: { id: 1, name: 'Elite Warriors' },
          clan_2: { id: 2, name: 'Dark Knights' },
          start_time: '2024-01-01T00:00:00.000Z',
          end_time: '2024-01-01T06:00:00.000Z',
          status: 'in_progress',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не состоит в клане' })
  async getMyClanWars(@Request() req): Promise<ClanWar[]> {
    const clan = await this.clanService.getUserClan(req.user.id);
    return this.clanService.getActiveWars(clan.id);
  }

  @Get('rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CacheTTL(60)
  @CacheKey('clan:rating')
  @ApiOperation({ 
    summary: 'Получить рейтинг кланов',
    description: 'Возвращает рейтинг всех кланов, отсортированный по количеству побед в войнах. Включает количество побед, поражений и общий рейтинг.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (по умолчанию 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество элементов на странице (по умолчанию 10)', example: 10 })
  @ApiResponse({ 
    status: 200, 
    description: 'Успешно возвращен рейтинг кланов',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Elite Warriors',
            max_members: 50,
            status: 'active',
            wins: 15,
            losses: 5,
            rating: 15,
            leader: { id: 1, first_name: 'John' },
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z'
          }
        ],
        total: 100,
        page: 1,
        limit: 10
      }
    }
  })
  async getClanRating(@Query() paginationDto?: PaginationDto): Promise<{ data: (Omit<Clan, 'combineWars'> & { wins: number; losses: number; rating: number })[]; total: number; page: number; limit: number }> {
    return this.clanService.getClanRating(paginationDto);
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @CacheTTL(300)
  @CacheKey('clan::id')
  @ApiOperation({ 
    summary: 'Получить клан по ID',
    description: 'Возвращает полную информацию о клане по его идентификатору, включая список участников и лидера.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID клана', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Успешно возвращен клан',
    schema: {
      example: {
        id: 1,
        name: 'Elite Warriors',
        max_members: 50,
        status: 'active',
        members: [],
        leader: { id: 1, first_name: 'John' },
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Клан не найден' })
  async findOne(@Param('id') id: string): Promise<Clan> {
    return this.clanService.findOne(+id);
  }

  @Post()
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @InvalidateCache('clan:list')
  @ApiOperation({ 
    summary: 'Создать новый клан',
    description: 'Создает новый клан с указанным лидером. Можно указать начальных участников, максимальное количество участников (по умолчанию 50) и статус. Изображение загружается через multipart/form-data.'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Elite Warriors' },
        leader_id: { type: 'number', example: 1 },
        max_members: { type: 'number', example: 50 },
        status: { type: 'string', example: 'active' },
        image: { type: 'string', format: 'binary' }
      },
      required: ['name', 'leader_id', 'image']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Клан успешно создан',
    schema: {
      example: {
        id: 1,
        name: 'Elite Warriors',
        max_members: 50,
        status: 'active',
        image_path: 'data/clan-images/clan-1234567890.jpg',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  async create(@Body() createClanDto: CreateClanDto, @UploadedFile() image: Express.Multer.File): Promise<Clan> {
    return this.clanService.create(createClanDto, image);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @InvalidateCache('clan::id', 'clan:list')
  @ApiOperation({ summary: 'Обновить клан', description: 'Обновляет информацию о клане. Изображение опционально, загружается через multipart/form-data.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Elite Warriors' },
        max_members: { type: 'number', example: 50 },
        status: { type: 'string', example: 'active' },
        image: { type: 'string', format: 'binary' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Возвращает обновленный клан' })
  async update(@Param('id') id: string, @Body() updateClanDto: UpdateClanDto, @UploadedFile() image?: Express.Multer.File): Promise<Clan> {
    return this.clanService.update(+id, updateClanDto, image);
  }

  @Delete(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiCookieAuth()
  @InvalidateCache('clan::id', 'clan:list')
  @ApiOperation({ summary: 'Удалить клан' })
  @ApiResponse({ status: 200, description: 'Клан успешно удален' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.clanService.remove(+id);
  }

  @Get('wars/available')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Получить доступные кланы для объявления войны',
    description: 'Возвращает список кланов, на которые можно объявить войну. Проверяет кулдаун CLAN_WAR_COOLDOWN и что у целевого клана не превышен лимит активных войн MAX_CLAN_WARS_COUNT. Доступно только для лидера клана.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список доступных кланов для войны',
    schema: {
      example: [
        {
          id: 2,
          name: 'Dark Knights',
          max_members: 50,
          status: 'active',
          leader: { id: 10, first_name: 'Jane' }
        }
      ]
    }
  })
  @ApiResponse({ status: 400, description: 'Кулдаун на объявление войны активен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не является лидером клана' })
  async getAvailableClansForWar(@Request() req): Promise<Clan[]> {
    return this.clanService.getAvailableClansForWar(req.user.id);
  }

  @Post('wars/declare')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Объявить войну целевому клану',
    description: 'Объявляет войну целевому клану. Проверяет кулдаун CLAN_WAR_COOLDOWN и что у целевого клана не превышен лимит активных войн. Длительность войны определяется настройкой CLAN_WAR_DURATION. Доступно только для лидера клана.'
  })
  @ApiBody({
    schema: {
      example: {
        target_clan_id: 2
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Война успешно объявлена',
    schema: {
      example: {
        id: 1,
        clan_1: { id: 1, name: 'Elite Warriors' },
        clan_2: { id: 2, name: 'Dark Knights' },
        start_time: '2024-01-01T00:00:00.000Z',
        end_time: '2024-01-01T06:00:00.000Z',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Нельзя объявить войну своему клану, кулдаун активен, целевой клан достиг лимита войн' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Целевой клан не найден или пользователь не является лидером' })
  async declareWar(@Request() req, @Body() declareWarDto: DeclareWarDto): Promise<ClanWar> {
    return this.clanService.declareWar(req.user.id, declareWarDto.target_clan_id);
  }

  @Get('wars/enemy-members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Получить участников вражеских кланов для атаки',
    description: 'Возвращает список всех участников кланов, с которыми у вашего клана активна война. Включает информацию о стражах каждого пользователя для расчета силы.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список участников вражеских кланов',
    schema: {
      example: [
        {
          id: 5,
          first_name: 'John',
          last_name: 'Doe',
          money: 10000,
          clan: { id: 2, name: 'Dark Knights' },
          guards: [
            { id: 1, name: 'Guard #1', strength: 50 }
          ]
        }
      ]
    }
  })
  @ApiResponse({ status: 400, description: 'Пользователь не состоит в клане' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getEnemyClanMembers(@Request() req): Promise<User[]> {
    return this.clanService.getEnemyClanMembers(req.user.id);
  }

  @Post('wars/attack')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Атаковать противника',
    description: 'Атакует участника вражеского клана во время активной войны. При атаке щит атакующего снимается. Если у защищающегося активен щит (shield_end_time > now), атака невозможна. Вероятность победы рассчитывается на основе силы и количества стражей. При победе можно украсть деньги и захватить стражей.'
  })
  @ApiBody({
    schema: {
      example: {
        target_user_id: 5
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Результаты атаки',
    schema: {
      example: {
        win_chance: 65.5,
        is_win: true,
        stolen_money: 1500,
        captured_guards: 2,
        stolen_items: [
          { type: 'money', value: '1500' },
          { type: 'guard', value: '123' }
        ]
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Ошибка: активен щит защищающегося, нет активной войны, недостаточно стражей, кулдаун атаки активен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async attackEnemy(@Request() req, @Body() attackEnemyDto: AttackEnemyDto): Promise<{
    win_chance: number;
    is_win: boolean;
    stolen_money: number;
    captured_guards: number;
    stolen_items: any[];
  }> {
    return this.clanService.attackEnemy(req.user.id, attackEnemyDto.target_user_id);
  }

  @Post('leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Покинуть текущий клан',
    description: 'Позволяет пользователю покинуть текущий клан. Лидер клана не может покинуть клан. После выхода устанавливается время выхода для проверки кулдауна на вступление в новый клан (CLAN_JOIN_COOLDOWN).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Пользователь успешно покинул клан',
    schema: {
      example: {
        id: 1,
        first_name: 'John',
        clan: null,
        clan_leave_time: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Пользователь не состоит в клане, пользователь является лидером клана' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async leaveClan(@Request() req): Promise<User> {
    return this.clanService.leaveClan(req.user.id);
  }

  @Post('application')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Создать заявку на вступление в клан',
    description: 'Создает заявку на вступление в указанный клан. Проверяет, что пользователь не состоит в клане, клан не переполнен, нет активной заявки и прошел кулдаун на вступление (CLAN_JOIN_COOLDOWN).'
  })
  @ApiBody({
    schema: {
      example: {
        clan_id: 1
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Заявка успешно создана',
    schema: {
      example: {
        id: 1,
        user: { id: 5, first_name: 'John' },
        clan: { id: 1, name: 'Elite Warriors' },
        status: 'pending',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Пользователь уже в клане, клан переполнен, заявка уже существует, кулдаун на вступление активен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Клан или пользователь не найден' })
  async createApplication(@Request() req, @Body() createClanApplicationDto: CreateClanApplicationDto): Promise<ClanApplication> {
    return this.clanService.createApplication(req.user.id, createClanApplicationDto.clan_id);
  }

  @Get('application')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Получить список заявок на вступление в клан (для лидера)',
    description: 'Возвращает список всех ожидающих (pending) заявок на вступление в клан пользователя. Доступно только для лидера клана. Заявки отсортированы по дате создания (новые первыми).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Список заявок успешно возвращен',
    schema: {
      example: [
        {
          id: 1,
          user: { id: 5, first_name: 'John', last_name: 'Doe' },
          clan: { id: 1, name: 'Elite Warriors' },
          status: 'pending',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }
      ]
    }
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не является лидером клана' })
  async getApplications(@Request() req): Promise<ClanApplication[]> {
    return this.clanService.getApplications(req.user.id);
  }

  @Post('application/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Принять заявку на вступление в клан',
    description: 'Принимает заявку на вступление в клан. Проверяет кулдаун на вступление (CLAN_JOIN_COOLDOWN) и что клан не переполнен. После принятия пользователь автоматически добавляется в клан.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID заявки', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Заявка успешно принята, пользователь добавлен в клан',
    schema: {
      example: {
        id: 1,
        user: { id: 5, first_name: 'John', clan: { id: 1 } },
        clan: { id: 1, name: 'Elite Warriors' },
        status: 'accepted',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Заявка не принадлежит вашему клану, заявка не в статусе pending, пользователь уже в клане, клан переполнен, кулдаун на вступление активен' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Заявка не найдена или пользователь не является лидером' })
  async acceptApplication(@Request() req, @Param('id') id: string): Promise<ClanApplication> {
    return this.clanService.acceptApplication(req.user.id, +id);
  }

  @Post('application/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Отклонить заявку на вступление в клан',
    description: 'Отклоняет заявку на вступление в клан. Статус заявки меняется на rejected. Пользователь не добавляется в клан.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID заявки', example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: 'Заявка успешно отклонена',
    schema: {
      example: {
        id: 1,
        user: { id: 5, first_name: 'John' },
        clan: { id: 1, name: 'Elite Warriors' },
        status: 'rejected',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Заявка не принадлежит вашему клану, заявка не в статусе pending' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Заявка не найдена или пользователь не является лидером' })
  async rejectApplication(@Request() req, @Param('id') id: string): Promise<ClanApplication> {
    return this.clanService.rejectApplication(req.user.id, +id);
  }
}
