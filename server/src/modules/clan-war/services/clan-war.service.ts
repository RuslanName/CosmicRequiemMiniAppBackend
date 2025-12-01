import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClanWar } from '../entities/clan-war.entity';
import { CreateClanWarDto } from '../dtos/create-clan-war.dto';
import { UpdateClanWarDto } from '../dtos/update-clan-war.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../../common/dtos/paginated-response.dto';
import { StolenItem } from '../entities/stolen-item.entity';
import { Clan } from '../../clan/entities/clan.entity';

@Injectable()
export class ClanWarService {
  constructor(
    @InjectRepository(ClanWar)
    private readonly clanWarRepository: Repository<ClanWar>,
    @InjectRepository(StolenItem)
    private readonly stolenItemRepository: Repository<StolenItem>,
    @InjectRepository(Clan)
    private readonly clanRepository: Repository<Clan>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<ClanWar>> {
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
      throw new NotFoundException(`Война кланов с ID ${id} не найдена`);
    }

    return clanWar;
  }

  async create(createClanWarDto: CreateClanWarDto): Promise<ClanWar> {
    const clanWar = this.clanWarRepository.create(createClanWarDto);
    return this.clanWarRepository.save(clanWar);
  }

  async update(
    id: number,
    updateClanWarDto: UpdateClanWarDto,
  ): Promise<ClanWar> {
    const clanWar = await this.clanWarRepository.findOne({
      where: { id },
      relations: ['clan_1', 'clan_2'],
    });

    if (!clanWar) {
      throw new NotFoundException(`Война кланов с ID ${id} не найдена`);
    }

    if (updateClanWarDto.clan_1_id !== undefined) {
      const clan1 = await this.clanRepository.findOne({
        where: { id: updateClanWarDto.clan_1_id },
      });
      if (!clan1) {
        throw new NotFoundException(
          `Клан с ID ${updateClanWarDto.clan_1_id} не найден`,
        );
      }
      clanWar.clan_1_id = updateClanWarDto.clan_1_id;
    }

    if (updateClanWarDto.clan_2_id !== undefined) {
      const clan2 = await this.clanRepository.findOne({
        where: { id: updateClanWarDto.clan_2_id },
      });
      if (!clan2) {
        throw new NotFoundException(
          `Клан с ID ${updateClanWarDto.clan_2_id} не найден`,
        );
      }
      clanWar.clan_2_id = updateClanWarDto.clan_2_id;
    }

    const finalClan1Id = updateClanWarDto.clan_1_id ?? clanWar.clan_1_id;
    const finalClan2Id = updateClanWarDto.clan_2_id ?? clanWar.clan_2_id;
    if (finalClan1Id === finalClan2Id) {
      throw new BadRequestException('Кланы не могут быть одинаковыми');
    }

    if (updateClanWarDto.start_time !== undefined) {
      clanWar.start_time = updateClanWarDto.start_time;
    }
    if (updateClanWarDto.end_time !== undefined) {
      clanWar.end_time = updateClanWarDto.end_time;
    }
    if (updateClanWarDto.status !== undefined) {
      clanWar.status = updateClanWarDto.status;
    }

    return this.clanWarRepository.save(clanWar);
  }

  async remove(id: number): Promise<void> {
    const clanWar = await this.clanWarRepository.findOne({ where: { id } });

    if (!clanWar) {
      throw new NotFoundException(`Война кланов с ID ${id} не найдена`);
    }

    const stolenItems = await this.stolenItemRepository.find({
      where: { clan_war_id: id },
    });

    for (const stolenItem of stolenItems) {
      stolenItem.clan_war_id = null;
      await this.stolenItemRepository.save(stolenItem);
    }

    await this.clanWarRepository.remove(clanWar);
  }
}
