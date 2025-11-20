import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../setting.entity';
import { UpdateSettingDto } from '../dtos/update-setting.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ data: Setting[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.settingRepository.findAndCount({
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Setting> {
    const setting = await this.settingRepository.findOne({ where: { id } });
    if (!setting)
      throw new NotFoundException(`Setting with ID ${id} not found`);
    return setting;
  }

  async findByKey(key: string): Promise<Setting | null> {
    return this.settingRepository.findOne({ where: { key } });
  }

  async update(
    id: number,
    updateSettingDto: UpdateSettingDto,
  ): Promise<Setting> {
    const setting = await this.settingRepository.findOne({ where: { id } });
    if (!setting)
      throw new NotFoundException(`Setting with ID ${id} not found`);

    Object.assign(setting, updateSettingDto);
    const saved = await this.settingRepository.save(setting);
    return saved;
  }
}
