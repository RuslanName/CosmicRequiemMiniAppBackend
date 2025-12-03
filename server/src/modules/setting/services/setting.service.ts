import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Setting } from '../setting.entity';
import { SettingResponseDto } from '../dtos/responses/setting-response.dto';
import { UpdateSettingDto } from '../dtos/update-setting.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../../common/dtos/paginated-response.dto';

@Injectable()
export class SettingService {
  private readonly SETTINGS_CACHE_KEY = 'settings:all';
  private readonly SETTINGS_CACHE_TTL = 300;

  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  private transformToSettingResponseDto(setting: Setting): SettingResponseDto {
    return {
      id: setting.id,
      key: setting.key,
      value: setting.value,
      created_at: setting.created_at,
      updated_at: setting.updated_at,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<SettingResponseDto>> {
    const page = Number(paginationDto.page) || 1;
    const limit = Number(paginationDto.limit) || 10;
    const skip = (page - 1) * limit;

    if (page === 1 && limit >= 1000) {
      const cached = await this.redis.get(this.SETTINGS_CACHE_KEY);
      if (cached) {
        const allSettings: Setting[] = JSON.parse(cached);
        return {
          data: allSettings.map((s) => this.transformToSettingResponseDto(s)),
          total: allSettings.length,
          page: 1,
          limit: allSettings.length,
        };
      }
    }

    const [data, total] = await this.settingRepository.findAndCount({
      skip,
      take: limit,
    });

    if (page === 1 && limit >= 1000) {
      await this.redis.setex(
        this.SETTINGS_CACHE_KEY,
        this.SETTINGS_CACHE_TTL,
        JSON.stringify(data),
      );
    }

    return {
      data: data.map((s) => this.transformToSettingResponseDto(s)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<SettingResponseDto> {
    const setting = await this.settingRepository.findOne({ where: { id } });
    if (!setting)
      throw new NotFoundException(`Setting with ID ${id} not found`);
    return this.transformToSettingResponseDto(setting);
  }

  async findByKey(key: string): Promise<SettingResponseDto | null> {
    const setting = await this.settingRepository.findOne({ where: { key } });
    return setting ? this.transformToSettingResponseDto(setting) : null;
  }

  async update(
    id: number,
    updateSettingDto: UpdateSettingDto,
  ): Promise<SettingResponseDto> {
    const setting = await this.settingRepository.findOne({ where: { id } });
    if (!setting)
      throw new NotFoundException(`Setting with ID ${id} not found`);

    Object.assign(setting, updateSettingDto);
    const saved = await this.settingRepository.save(setting);
    await this.redis.del(this.SETTINGS_CACHE_KEY);
    return this.transformToSettingResponseDto(saved);
  }
}
