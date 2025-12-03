import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventHistory } from './event-history.entity';
import { EventHistoryType } from './enums/event-history-type.enum';
import { StolenItem } from '../clan-war/entities/stolen-item.entity';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';

@Injectable()
export class EventHistoryService {
  constructor(
    @InjectRepository(EventHistory)
    private readonly eventHistoryRepository: Repository<EventHistory>,
  ) {}

  async create(
    userId: number,
    type: EventHistoryType,
    stolenItems: StolenItem[],
    opponentId?: number | null,
  ): Promise<EventHistory> {
    const eventHistory = this.eventHistoryRepository.create({
      user_id: userId,
      type,
      stolen_items: stolenItems,
      opponent_id: opponentId || null,
    });
    return this.eventHistoryRepository.save(eventHistory);
  }

  async findByUserId(
    userId: number,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResponseDto<EventHistory>> {
    const { page = 1, limit = 10 } = paginationDto || {};
    const skip = (page - 1) * limit;

    const queryBuilder = this.eventHistoryRepository
      .createQueryBuilder('event_history')
      .leftJoinAndSelect('event_history.user', 'user')
      .leftJoinAndSelect('event_history.opponent', 'opponent')
      .leftJoinAndSelect('event_history.stolen_items', 'stolen_items')
      .leftJoinAndSelect('stolen_items.thief', 'thief')
      .leftJoinAndSelect('stolen_items.victim', 'victim')
      .where('event_history.user_id = :userId', { userId })
      .orderBy('event_history.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
