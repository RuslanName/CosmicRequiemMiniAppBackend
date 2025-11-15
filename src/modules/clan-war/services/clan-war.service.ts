import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClanWar } from '../entities/clan-war.entity';
import { CreateClanWarDto } from '../dtos/create-clan-war.dto';
import { UpdateClanWarDto } from '../dtos/update-clan-war.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

@Injectable()
export class ClanWarService {
  constructor(
    @InjectRepository(ClanWar)
    private readonly clanWarRepository: Repository<ClanWar>,
  ) {}

  async findAll(paginationDto: PaginationDto): Promise<{ data: ClanWar[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.clanWarRepository.findAndCount({
      relations: ['clan_1', 'clan_2'],
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<ClanWar> {
    const clanWar = await this.clanWarRepository.findOne({
      where: { id },
      relations: ['clan_1', 'clan_2'],
    });

    if (!clanWar) {
      throw new NotFoundException(`ClanWar with ID ${id} not found`);
    }

    return clanWar;
  }

  async create(createClanWarDto: CreateClanWarDto): Promise<ClanWar> {
    const clanWar = this.clanWarRepository.create(createClanWarDto);
    return this.clanWarRepository.save(clanWar);
  }

  async update(id: number, updateClanWarDto: UpdateClanWarDto): Promise<ClanWar> {
    const clanWar = await this.clanWarRepository.findOne({
      where: { id },
      relations: ['clan_1', 'clan_2'],
    });

    if (!clanWar) {
      throw new NotFoundException(`ClanWar with ID ${id} not found`);
    }

    Object.assign(clanWar, updateClanWarDto);
    return this.clanWarRepository.save(clanWar);
  }

  async remove(id: number): Promise<void> {
    const clanWar = await this.clanWarRepository.findOne({ where: { id } });

    if (!clanWar) {
      throw new NotFoundException(`ClanWar with ID ${id} not found`);
    }

    await this.clanWarRepository.remove(clanWar);
  }
}
