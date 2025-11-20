import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { UpdateAdminDto } from './dtos/update-admin.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ data: Admin[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.adminRepository.findAndCount({
      relations: ['user'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  async findByUserId(userId: number): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
  }

  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const { password, ...rest } = createAdminDto;

    const existingAdmin = await this.adminRepository.findOne({
      where: [
        { username: createAdminDto.username },
        { user_id: createAdminDto.user_id },
      ],
    });

    if (existingAdmin) {
      throw new BadRequestException(
        'Admin with this username or user_id already exists',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = this.adminRepository.create({
      ...rest,
      password_hash: passwordHash,
      is_system_admin: rest.is_system_admin ?? false,
    });

    return await this.adminRepository.save(admin);
  }

  async update(id: number, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.findOne(id);

    if (updateAdminDto.username) {
      const existingAdmin = await this.adminRepository.findOne({
        where: { username: updateAdminDto.username },
      });

      if (existingAdmin && existingAdmin.id !== id) {
        throw new BadRequestException(
          'Admin with this username already exists',
        );
      }
    }

    if (updateAdminDto.user_id) {
      const existingAdmin = await this.adminRepository.findOne({
        where: { user_id: updateAdminDto.user_id },
      });

      if (existingAdmin && existingAdmin.id !== id) {
        throw new BadRequestException('Admin with this user_id already exists');
      }
    }

    if (updateAdminDto.password) {
      updateAdminDto.password = await bcrypt.hash(updateAdminDto.password, 10);
    }

    const { password, ...rest } = updateAdminDto;
    Object.assign(admin, rest);

    if (password) {
      admin.password_hash = password;
    }

    return await this.adminRepository.save(admin);
  }

  async remove(id: number): Promise<void> {
    const admin = await this.findOne(id);
    await this.adminRepository.remove(admin);
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
}
