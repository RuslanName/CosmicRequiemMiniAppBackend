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
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { User } from '../user/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<Admin>> {
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
      throw new NotFoundException(`Администратор с ID ${id} не найден`);
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
        'Администратор с таким именем пользователя или user_id уже существует',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = this.adminRepository.create({
      user_id: createAdminDto.user_id,
      username: createAdminDto.username,
      password_hash: passwordHash,
      is_system_admin: false,
    });

    return await this.adminRepository.save(admin);
  }

  async update(id: number, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.findOne(id);

    if (admin.is_system_admin) {
      throw new BadRequestException(
        'Нельзя изменять системного администратора',
      );
    }

    if (updateAdminDto.username) {
      const existingAdmin = await this.adminRepository.findOne({
        where: { username: updateAdminDto.username },
      });

      if (existingAdmin && existingAdmin.id !== id) {
        throw new BadRequestException(
          'Администратор с таким именем пользователя уже существует',
        );
      }
    }

    if (
      updateAdminDto.user_id !== undefined &&
      updateAdminDto.user_id !== admin.user_id
    ) {
      const user = await this.userRepository.findOne({
        where: { id: updateAdminDto.user_id },
      });

      if (!user) {
        throw new NotFoundException(
          `Пользователь с ID ${updateAdminDto.user_id} не найден`,
        );
      }

      const existingAdmin = await this.adminRepository.findOne({
        where: { user_id: updateAdminDto.user_id },
      });

      if (existingAdmin && existingAdmin.id !== id) {
        throw new BadRequestException(
          'Администратор с таким user_id уже существует',
        );
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

    if (admin.is_system_admin) {
      throw new BadRequestException('Нельзя удалить системного администратора');
    }

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
