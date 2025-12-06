import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/user.entity';
import { UserGuard } from '../../user-guard/user-guard.entity';
import { createHmac, randomUUID } from 'crypto';
import { AuthDto } from '../dtos/auth.dto';
import { ENV } from '../../../config/constants';
import { Settings } from '../../../config/setting.config';
import { SettingKey } from '../../setting/enums/setting-key.enum';
import { UserTaskService } from '../../task/services/user-task.service';
import { TaskType } from '../../task/enums/task-type.enum';
import { SessionService } from './session.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
    private readonly userTaskService: UserTaskService,
    private readonly sessionService: SessionService,
  ) {}

  private async updateUserReferralsCount(referrerId: number): Promise<void> {
    const referralsCount = await this.userRepository.count({
      where: { referrerId: referrerId },
    });

    await this.userRepository.update(referrerId, {
      referrals_count: referralsCount,
    });
  }

  private async updateUserGuardsStats(userId: number): Promise<void> {
    const guards = await this.userGuardRepository.find({
      where: { user_id: userId },
    });
    const guardsCount = guards.length;
    const strength = guards.reduce(
      (sum, guard) => sum + Number(guard.strength),
      0,
    );

    await this.userRepository.update(userId, {
      guards_count: guardsCount,
      strength: strength,
    });
  }

  async validateAuth(
    dto: AuthDto,
    startParam?: string,
  ): Promise<{
    sessionId: string;
  }> {
    const { user, sign, vk_params } = dto;

    if (ENV.VERIFY_VK_SIGNATURE && !this.verifySignature(vk_params, sign)) {
      throw new UnauthorizedException('Неверная подпись VK');
    }

    if (!vk_params.vk_user_id) {
      throw new UnauthorizedException(
        'Отсутствует vk_user_id в параметрах запуска',
      );
    }

    const vk_id = parseInt(vk_params.vk_user_id, 10);

    if (isNaN(vk_id) || vk_id <= 0) {
      throw new UnauthorizedException(
        'Неверный vk_user_id в параметрах запуска',
      );
    }

    if (+user.id !== +vk_id) {
      throw new UnauthorizedException(
        'Неверные параметры: user.id не совпадает с vk_user_id',
      );
    }

    let dbUser = await this.userRepository.findOne({
      where: { vk_id },
      relations: ['clan', 'referrer'],
    });

    if (!dbUser) {
      const photoUrl = user.photo_max_orig || user.photo_200 || '';
      dbUser = this.userRepository.create({
        vk_id,
        first_name: user.first_name,
        last_name: user.last_name || null,
        sex: user.sex ?? 0,
        image_path: null,
        birthday_date: this.formatBirthday(user.bdate, user.bdate_visibility),
        last_login_at: new Date(),
        referral_link_id: randomUUID(),
      });
      await this.userRepository.save(dbUser);

      const firstGuard = this.userGuardRepository.create({
        name: `Страж #${dbUser.id}`,
        strength: Settings[
          SettingKey.INITIAL_STRENGTH_FIRST_USER_GUARD
        ] as number,
        is_first: true,
        user: dbUser,
      });
      await this.userGuardRepository.save(firstGuard);
      await this.updateUserGuardsStats(dbUser.id);

      if (photoUrl) {
        try {
          if (!this.verifyVkImageUrl(photoUrl)) {
            console.warn(
              `Неверный URL аватара профиля для пользователя ${dbUser.id}, пропускаем загрузку`,
            );
          } else {
            await this.downloadAndSaveUserAvatar(photoUrl, dbUser.id);
            const updatedUser = await this.userRepository.findOne({
              where: { id: dbUser.id },
              relations: ['clan', 'referrer'],
            });
            if (updatedUser) {
              dbUser = updatedUser;
            }
          }
        } catch (error) {
          console.error(
            `Ошибка при загрузке аватара для пользователя ${dbUser.id}:`,
            error.message,
          );
        }
      }

      if (!dbUser.clan || !dbUser.referrer) {
        dbUser = await this.userRepository.findOne({
          where: { id: dbUser.id },
          relations: ['clan', 'referrer'],
        });
        if (!dbUser) {
          throw new UnauthorizedException(
            'Пользователь не найден после создания',
          );
        }
      }

      await this.processReferralLink(dbUser, startParam);

      if (!dbUser.referrer) {
        const initialReferrerVkId = Settings[
          SettingKey.INITIAL_REFERRER_VK_ID
        ] as number;
        if (initialReferrerVkId && initialReferrerVkId > 0) {
          const initialReferrer = await this.userRepository.findOne({
            where: { vk_id: Number(initialReferrerVkId) },
          });

          if (initialReferrer) {
            dbUser.referrer = initialReferrer;
            await this.userRepository.save(dbUser);
            await this.updateUserReferralsCount(initialReferrer.id);

            const referralGuardStrength = Settings[
              SettingKey.INITIAL_STRENGTH_FIRST_USER_GUARD
            ] as number;

            const referralGuardName =
              `${dbUser.first_name} ${dbUser.last_name || ''}`.trim();

            const referralGuard = this.userGuardRepository.create({
              name: referralGuardName,
              strength: referralGuardStrength,
              is_first: false,
              user: initialReferrer,
              guard_as_user: dbUser,
            });
            await this.userGuardRepository.save(referralGuard);
            await this.updateUserGuardsStats(initialReferrer.id);

            dbUser.user_as_guard = referralGuard;
            await this.userRepository.save(dbUser);
          }
        }
      }

      await this.userTaskService.initializeTasksForUser(dbUser.id);

      dbUser = await this.userRepository.findOne({
        where: { id: dbUser.id },
        relations: ['clan', 'referrer'],
      });
      if (!dbUser) {
        throw new UnauthorizedException(
          'Пользователь не найден после инициализации',
        );
      }
    } else {
      await this.processReferralLink(dbUser, startParam);

      const photoUrl = user.photo_max_orig || user.photo_200 || null;
      if (photoUrl) {
        if (!this.verifyVkImageUrl(photoUrl)) {
          throw new UnauthorizedException('Неверный URL аватара профиля');
        }
        const needsUpdate =
          !dbUser.image_path ||
          dbUser.image_path.startsWith('http') ||
          (dbUser.image_path &&
            !fs.existsSync(path.join(process.cwd(), dbUser.image_path)));

        if (needsUpdate) {
          await this.downloadAndSaveUserAvatar(photoUrl, dbUser.id);
          dbUser = await this.userRepository.findOne({
            where: { id: dbUser.id },
            relations: ['clan', 'referrer'],
          });
          if (!dbUser) {
            throw new UnauthorizedException(
              'Пользователь не найден после обновления аватара',
            );
          }
        }
      }

      dbUser.first_name = user.first_name;
      dbUser.last_name = user.last_name || null;
      dbUser.sex = user.sex ?? dbUser.sex;
      dbUser.birthday_date = this.formatBirthday(
        user.bdate,
        user.bdate_visibility,
      );
      dbUser.last_login_at = new Date();

      if (!dbUser.referral_link_id) {
        dbUser.referral_link_id = randomUUID();
      }

      await this.userRepository.save(dbUser);

      await this.userTaskService.initializeTasksForUser(dbUser.id);
    }

    await this.sessionService.revokeAllUserSessions(dbUser.id);

    const sessionExpiresIn = this.parseExpiresIn(ENV.SESSION_EXPIRES_IN);
    const sessionId = await this.sessionService.createSession(
      dbUser.id,
      sessionExpiresIn,
    );

    return {
      sessionId,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionService.revokeSession(sessionId);
  }

  private async processReferralLink(
    dbUser: User,
    startParam?: string,
  ): Promise<void> {
    if (dbUser.referrer || !startParam?.startsWith('ref_')) {
      return;
    }

    const referralLinkId = startParam.replace('ref_', '');
    if (!referralLinkId) {
      return;
    }

    const referrerUser = await this.userRepository.findOne({
      where: { referral_link_id: referralLinkId },
    });

    if (!referrerUser || referrerUser.id === dbUser.id) {
      return;
    }

    dbUser.referrer = referrerUser;
    await this.userRepository.save(dbUser);

    const referrerReward = Settings[SettingKey.REFERRER_MONEY_REWARD] as number;
    referrerUser.money = Number(referrerUser.money) + referrerReward;
    await this.userRepository.save(referrerUser);

    const referralGuardStrength = Settings[
      SettingKey.INITIAL_STRENGTH_FIRST_USER_GUARD
    ] as number;

    const referralGuardName =
      `${dbUser.first_name} ${dbUser.last_name || ''}`.trim();

    const referralGuard = this.userGuardRepository.create({
      name: referralGuardName,
      strength: referralGuardStrength,
      is_first: false,
      user: referrerUser,
      guard_as_user: dbUser,
    });
    await this.userGuardRepository.save(referralGuard);
    await this.updateUserGuardsStats(referrerUser.id);
    await this.updateUserReferralsCount(referrerUser.id);

    dbUser.user_as_guard = referralGuard;
    await this.userRepository.save(dbUser);

    await this.userTaskService.updateTaskProgress(
      referrerUser.id,
      TaskType.FRIEND_INVITE,
    );
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 30 * 24 * 60 * 60;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 30 * 24 * 60 * 60;
    }
  }

  private verifySignature(
    params: Record<string, string>,
    sign: string,
  ): boolean {
    const VK_APP_SECRET = ENV.VK_APP_SECRET;

    if (!VK_APP_SECRET) {
      throw new Error('VK_APP_SECRET is not set');
    }

    if (!params || typeof params !== 'object') {
      throw new UnauthorizedException('Неверные параметры');
    }

    const allParams: Record<string, string> = { ...params, sign };
    const inputString = Object.keys(allParams)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(allParams[key])}`)
      .join('&');

    const startIndex = inputString.indexOf('sign=');
    if (startIndex === -1) {
      return false;
    }

    const endIndex = inputString.indexOf('&', startIndex);
    const hashString =
      endIndex === -1
        ? inputString.substring(startIndex).trim().replace(/sign=/, '')
        : inputString
            .substring(startIndex, endIndex)
            .trim()
            .replace(/sign=/, '');

    const checkString =
      endIndex === -1
        ? inputString.substring(0, startIndex).trim()
        : (
            inputString.substring(0, startIndex) +
            inputString.substring(endIndex + 1, inputString.length)
          ).trim();

    const digest = createHmac('sha256', VK_APP_SECRET)
      .update(checkString)
      .digest('base64url')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=$/, '');

    return digest === hashString;
  }

  private verifyVkImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const vkImageUrlPattern =
      /^https?:\/\/(?:[a-z0-9-]+\.)?(?:vk\.com|userapi\.com|vk-cdn\.net|vkuser\.net|vk\.me|vkuseraudio\.net|vk-cdn\.org)\/.+$/i;

    return vkImageUrlPattern.test(url);
  }

  private formatBirthday(bdate?: string, visibility?: number): string | null {
    if (!bdate || visibility === undefined) return null;

    switch (visibility) {
      case 0:
        return null;
      case 1:
        return bdate;
      case 2:
        return bdate;
      default:
        return null;
    }
  }

  private async downloadAndSaveUserAvatar(
    photoUrl: string,
    userId: number,
  ): Promise<void> {
    try {
      if (!photoUrl || !photoUrl.startsWith('http')) {
        return;
      }

      const response = await fetch(photoUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const uploadDir = path.join(process.cwd(), 'data', 'user-avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExtension = path.extname(new URL(photoUrl).pathname) || '.jpg';
      const fileName = `user-${userId}-${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      const imagePath = path
        .join('data', 'user-avatars', fileName)
        .replace(/\\/g, '/');

      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        const oldImagePath = user.image_path;
        user.image_path = imagePath;
        await this.userRepository.save(user);

        const savedUser = await this.userRepository.findOne({
          where: { id: userId },
        });
        if (!savedUser || savedUser.image_path !== imagePath) {
          console.error(
            `Failed to save image_path for user ${userId}. Expected: ${imagePath}, Got: ${savedUser?.image_path}`,
          );
        }

        if (oldImagePath && !oldImagePath.startsWith('http')) {
          const oldFilePath = path.join(process.cwd(), oldImagePath);
          if (fs.existsSync(oldFilePath) && oldFilePath !== filePath) {
            try {
              fs.unlinkSync(oldFilePath);
            } catch (error) {
              console.error(`Error deleting old avatar file: ${error.message}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error downloading user avatar: ${error.message}`);
    }
  }
}
