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
import { AdminResponseDto } from './dtos/responses/admin-response.dto';
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

  private transformToAdminResponseDto(admin: Admin): AdminResponseDto {
    return {
      id: admin.id,
      user_id: admin.user_id,
      username: admin.username,
      is_system_admin: admin.is_system_admin,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<AdminResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [admins, total] = await this.adminRepository.findAndCount({
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const data = admins.map((admin) => this.transformToAdminResponseDto(admin));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<AdminResponseDto> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!admin) {
      throw new NotFoundException(`Администратор с ID ${id} не найден`);
    }

    return this.transformToAdminResponseDto(admin);
  }

  async findByUserId(userId: number): Promise<Admin | null> {
    return await this.adminRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });
  }

  async create(createAdminDto: CreateAdminDto): Promise<AdminResponseDto> {
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

    const savedAdmin = await this.adminRepository.save(admin);
    return this.transformToAdminResponseDto(savedAdmin);
  }

  async update(id: number, updateAdminDto: UpdateAdminDto): Promise<AdminResponseDto> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!admin) {
      throw new NotFoundException(`Администратор с ID ${id} не найден`);
    }

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

    const savedAdmin = await this.adminRepository.save(admin);
    return this.transformToAdminResponseDto(savedAdmin);
  }

  async remove(id: number): Promise<void> {
    const admin = await this.adminRepository.findOne({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException(`Администратор с ID ${id} не найден`);
    }

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
