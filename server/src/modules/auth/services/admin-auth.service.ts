import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../../admin/admin.entity';
import { AdminLoginDto } from '../dtos/admin-login.dto';
import * as bcrypt from 'bcrypt';
import { ENV } from '../../../config/constants';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async validateAdmin(
    loginDto: AdminLoginDto,
  ): Promise<{ token: string; admin: Admin }> {
    const { username, password } = loginDto;

    const admin = await this.adminRepository.findOne({
      where: { username },
      relations: ['user'],
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: admin.user.id,
      adminId: admin.id,
      type: 'admin',
    };

    const token = this.jwtService.sign(payload, {
      secret: ENV.JWT_ADMIN_SECRET,
      expiresIn: ENV.JWT_ADMIN_EXPIRES_IN as any,
    });

    return { token, admin };
  }

  async createSystemAdmin(
    vkId: number,
    username: string,
    password: string,
    userId: number,
  ): Promise<Admin> {
    const existingAdmin = await this.adminRepository.findOne({
      where: { username },
    });

    if (existingAdmin) {
      return existingAdmin;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = this.adminRepository.create({
      username,
      password_hash: passwordHash,
      is_system_admin: true,
      user_id: userId,
    });

    return await this.adminRepository.save(admin);
  }

  async findAdminByUserId(userId: number): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
  }
}
