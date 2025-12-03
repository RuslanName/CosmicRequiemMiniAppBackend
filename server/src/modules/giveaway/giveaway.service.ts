import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';
import { Giveaway } from './giveaway.entity';
import { GiveawayResponseDto } from './dtos/responses/giveaway-response.dto';
import { CreateGiveawayDto } from './dtos/create-giveaway.dto';
import { UpdateGiveawayDto } from './dtos/update-giveaway.dto';

@Injectable()
export class GiveawayService {
  constructor(
    @InjectRepository(Giveaway)
    private readonly giveawayRepository: Repository<Giveaway>,
  ) {}

  private transformToGiveawayResponseDto(
    giveaway: Giveaway,
  ): GiveawayResponseDto {
    return {
      id: giveaway.id,
      url: giveaway.url,
      image_path: giveaway.image_path,
    };
  }

  async findOne(): Promise<GiveawayResponseDto | null> {
    const giveaway = await this.giveawayRepository.findOne({
      where: {},
      order: { created_at: 'DESC' },
    });
    return giveaway ? this.transformToGiveawayResponseDto(giveaway) : null;
  }

  async findAvailable(): Promise<GiveawayResponseDto | null> {
    return this.findOne();
  }

  private saveGiveawayImage(file: Express.Multer.File): string {
    if (!file) {
      throw new BadRequestException('Файл изображения обязателен');
    }

    const uploadDir = path.join(process.cwd(), 'data', 'giveaway-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `giveaway-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return path.join('data', 'giveaway-images', fileName).replace(/\\/g, '/');
  }

  private deleteGiveawayImage(imagePath: string): void {
    if (imagePath && imagePath.startsWith('data/giveaway-images/')) {
      const fullPath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  }

  async create(
    createGiveawayDto: CreateGiveawayDto,
    image?: Express.Multer.File,
  ): Promise<GiveawayResponseDto> {
    const existingGiveaway = await this.giveawayRepository.findOne({
      where: {},
      order: { created_at: 'DESC' },
    });

    if (existingGiveaway) {
      throw new BadRequestException(
        'Розыгрыш уже существует. Одновременно может существовать только один розыгрыш. Пожалуйста, обновите или удалите существующий.',
      );
    }

    const imagePath = image ? this.saveGiveawayImage(image) : null;
    const giveaway = this.giveawayRepository.create({
      ...createGiveawayDto,
      image_path: imagePath,
    });
    const savedGiveaway = await this.giveawayRepository.save(giveaway);
    return this.transformToGiveawayResponseDto(savedGiveaway);
  }

  async update(
    id: number,
    updateGiveawayDto: UpdateGiveawayDto,
    image?: Express.Multer.File,
  ): Promise<GiveawayResponseDto> {
    const giveaway = await this.giveawayRepository.findOne({ where: { id } });

    if (!giveaway) {
      throw new NotFoundException(`Розыгрыш с ID ${id} не найден`);
    }

    if (image) {
      if (giveaway.image_path) {
        this.deleteGiveawayImage(giveaway.image_path);
      }
      const imagePath = this.saveGiveawayImage(image);
      updateGiveawayDto = {
        ...updateGiveawayDto,
        image_path: imagePath,
      } as UpdateGiveawayDto;
    }

    Object.assign(giveaway, updateGiveawayDto);
    const savedGiveaway = await this.giveawayRepository.save(giveaway);
    return this.transformToGiveawayResponseDto(savedGiveaway);
  }

  async remove(id: number): Promise<void> {
    const giveaway = await this.giveawayRepository.findOne({ where: { id } });

    if (!giveaway) {
      throw new NotFoundException(`Розыгрыш с ID ${id} не найден`);
    }

    if (giveaway.image_path) {
      this.deleteGiveawayImage(giveaway.image_path);
    }

    await this.giveawayRepository.remove(giveaway);
  }
}
