import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserBoostService } from './user-boost.service';

@ApiTags('UserBoost')
@Controller('user-boosts')
export class UserBoostController {
  constructor(private readonly userBoostService: UserBoostService) {}
}
