import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MealPlansService } from './meal-plans.service';
import { CreateMealSlotDto } from './dto/create-meal-slot.dto';
import { UpdateMealSlotDto } from './dto/update-meal-slot.dto';

@Controller('meal-slots')
@UseGuards(JwtAuthGuard)
export class MealPlansController {
  constructor(private service: MealPlansService) {}

  @Get()
  findByWeek(
    @CurrentUser('id') userId: string,
    @Query('week') week: string,
  ) {
    return this.service.findByWeek(userId, week);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateMealSlotDto) {
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMealSlotDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
