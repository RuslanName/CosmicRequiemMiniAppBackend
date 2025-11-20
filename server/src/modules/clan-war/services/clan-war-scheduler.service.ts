import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { ClanWar } from '../entities/clan-war.entity';
import { StolenItem } from '../entities/stolen-item.entity';
import { ClanWarStatus } from '../enums/clan-war-status.enum';
import { StolenItemType } from '../enums/stolen-item-type.enum';
import { User } from '../../user/user.entity';
import { UserGuard } from '../../user-guard/user-guard.entity';

@Injectable()
export class ClanWarSchedulerService {
  constructor(
    @InjectRepository(ClanWar)
    private readonly clanWarRepository: Repository<ClanWar>,
    @InjectRepository(StolenItem)
    private readonly stolenItemRepository: Repository<StolenItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
  ) {}

  @Cron('0 */5 * * * *')
  async completeExpiredWars() {
    const now = new Date();

    const expiredWars = await this.clanWarRepository.find({
      where: {
        end_time: LessThan(now),
        status: ClanWarStatus.IN_PROGRESS,
      },
      relations: ['clan_1', 'clan_2', 'stolen_items'],
    });

    for (const war of expiredWars) {
      await this.completeWar(war);
    }
  }

  private async completeWar(war: ClanWar): Promise<void> {
    if (!war.stolen_items || war.stolen_items.length === 0) {
      war.status = ClanWarStatus.WON_BY_CLAN_1;
      await this.clanWarRepository.save(war);
      return;
    }

    const stolenItems = await this.stolenItemRepository.find({
      where: { clan_war_id: war.id },
      relations: ['thief', 'victim', 'thief.clan', 'victim.clan'],
    });

    let clan1StolenCount = 0;
    let clan2StolenCount = 0;

    for (const item of stolenItems) {
      if (item.thief.clan?.id === war.clan_1.id) {
        clan1StolenCount++;
      } else if (item.thief.clan?.id === war.clan_2.id) {
        clan2StolenCount++;
      }
    }

    const winnerStatus =
      clan1StolenCount > clan2StolenCount
        ? ClanWarStatus.WON_BY_CLAN_1
        : clan2StolenCount > clan1StolenCount
          ? ClanWarStatus.WON_BY_CLAN_2
          : ClanWarStatus.WON_BY_CLAN_1;

    war.status = winnerStatus;
    await this.clanWarRepository.save(war);

    const winnerClanId =
      winnerStatus === ClanWarStatus.WON_BY_CLAN_1
        ? war.clan_1.id
        : war.clan_2.id;

    const loserClanId =
      winnerStatus === ClanWarStatus.WON_BY_CLAN_1
        ? war.clan_2.id
        : war.clan_1.id;

    for (const item of stolenItems) {
      const thiefClanId = item.thief.clan?.id;
      const victimClanId = item.victim.clan?.id;

      if (item.type === StolenItemType.MONEY) {
        const stolenAmount = parseInt(item.value, 10);

        if (victimClanId === winnerClanId) {
          item.victim.money = Number(item.victim.money) + stolenAmount;
          item.thief.money = Number(item.thief.money) - stolenAmount;
          await this.userRepository.save([item.victim, item.thief]);
        } else if (thiefClanId === loserClanId) {
          item.victim.money = Number(item.victim.money) + stolenAmount;
          item.thief.money = Number(item.thief.money) - stolenAmount;
          await this.userRepository.save([item.victim, item.thief]);
        }
      } else if (item.type === StolenItemType.GUARD) {
        const guardId = parseInt(item.value, 10);
        const guard = await this.userGuardRepository.findOne({
          where: { id: guardId },
          relations: ['user'],
        });

        if (!guard) continue;

        if (victimClanId === winnerClanId) {
          guard.user = item.victim;
          await this.userGuardRepository.save(guard);
        } else if (thiefClanId === loserClanId) {
          guard.user = item.victim;
          await this.userGuardRepository.save(guard);
        }
      }
    }
  }
}
