import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserGuardController } from './user-guard.controller';
import { UserGuardService } from './user-guard.service';
import { UserGuard } from './user-guard.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserGuard])],
  controllers: [UserGuardController],
  providers: [UserGuardService],
  exports: [UserGuardService],
})
export class UserGuardModule {}
