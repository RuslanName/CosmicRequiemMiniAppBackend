import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/user.entity';
import { UserGuard } from '../../user-guard/user-guard.entity';
import { createHmac, randomUUID } from 'crypto';
import { AuthDto } from '../dtos/auth.dto';
import { ENV } from '../../../config/constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserGuard)
    private readonly userGuardRepository: Repository<UserGuard>,
  ) {}

  async validateAuth(dto: AuthDto): Promise<string> {
    const { user, sign, vk_params } = dto;

    if (!this.verifySignature(vk_params, sign)) {
      throw new UnauthorizedException('Invalid VK signature');
    }

    const vk_id = user.id;

    let dbUser = await this.userRepository.findOne({
      where: { vk_id },
      relations: ['clan', 'referrer'],
    });

    const startParam = vk_params.start;
    let referrerUser: User | null = null;

    if (startParam && startParam.startsWith('ref_')) {
      const referrerLinkId = startParam.replace('ref_', '');
      referrerUser = await this.userRepository.findOne({
        where: { referral_link_id: referrerLinkId },
      });
    }

    if (!dbUser) {
      dbUser = this.userRepository.create({
        vk_id,
        first_name: user.first_name,
        last_name: user.last_name || null,
        sex: user.sex ?? 0,
        avatar_url: user.photo_max_orig || user.photo_200 || '',
        birthday_date: this.formatBirthday(user.bdate, user.bdate_visibility),
        last_login_at: new Date(),
        referral_link_id: randomUUID(),
        referrer: referrerUser || undefined,
      });
      await this.userRepository.save(dbUser);

      const firstGuard = this.userGuardRepository.create({
        name: `#${dbUser.id}`,
        strength: 0,
        is_first: true,
        user: dbUser,
      });
      await this.userGuardRepository.save(firstGuard);
    } else {
      dbUser.first_name = user.first_name;
      dbUser.last_name = user.last_name || null;
      dbUser.sex = user.sex ?? dbUser.sex;
      dbUser.avatar_url =
        user.photo_max_orig || user.photo_200 || dbUser.avatar_url;
      dbUser.birthday_date = this.formatBirthday(
        user.bdate,
        user.bdate_visibility,
      );
      dbUser.last_login_at = new Date();

      if (!dbUser.referral_link_id) {
        dbUser.referral_link_id = randomUUID();
      }

      if (!dbUser.referrer && referrerUser) {
        dbUser.referrer = referrerUser;
      }

      await this.userRepository.save(dbUser);
    }

    const payload = { sub: dbUser.id };
    return this.jwtService.sign(payload);
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
      throw new UnauthorizedException('Invalid params');
    }

    const queryString = Object.keys(params)
      .filter((key) => key.startsWith('vk_'))
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const computedHash = createHmac('sha256', VK_APP_SECRET)
      .update(queryString)
      .digest('base64url');

    return computedHash === sign;
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
}
