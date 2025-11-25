import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Giveaway } from './giveaway.entity';
import { CreateGiveawayDto } from './dtos/create-giveaway.dto';
import { UpdateGiveawayDto } from './dtos/update-giveaway.dto';

@Injectable()
export class GiveawayService {
  constructor(
    @InjectRepository(Giveaway)
    private readonly giveawayRepository: Repository<Giveaway>,
  ) {}

  async findOne(): Promise<Giveaway | null> {
    return this.giveawayRepository.findOne({
      where: {},
      order: { created_at: 'DESC' },
    });
  }

  async findAvailable(): Promise<Giveaway | null> {
    return this.findOne();
  }

  async create(createGiveawayDto: CreateGiveawayDto): Promise<Giveaway> {
    const existingGiveaway = await this.giveawayRepository.findOne({
      where: {},
      order: { created_at: 'DESC' },
    });

    if (existingGiveaway) {
      throw new BadRequestException(
        'Giveaway already exists. Only one giveaway can exist at a time. Please update or delete the existing one.',
      );
    }

    const giveaway = this.giveawayRepository.create(createGiveawayDto);
    return this.giveawayRepository.save(giveaway);
  }

  async update(
    id: number,
    updateGiveawayDto: UpdateGiveawayDto,
  ): Promise<Giveaway> {
    const giveaway = await this.giveawayRepository.findOne({ where: { id } });

    if (!giveaway) {
      throw new NotFoundException(`Giveaway with ID ${id} not found`);
    }

    Object.assign(giveaway, updateGiveawayDto);
    return this.giveawayRepository.save(giveaway);
  }

  async remove(id: number): Promise<void> {
    const giveaway = await this.giveawayRepository.findOne({ where: { id } });

    if (!giveaway) {
      throw new NotFoundException(`Giveaway with ID ${id} not found`);
    }

    await this.giveawayRepository.remove(giveaway);
  }
}
