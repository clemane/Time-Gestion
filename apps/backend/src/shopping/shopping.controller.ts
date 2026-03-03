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
import { ShoppingService } from './shopping.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { GenerateShoppingDto } from './dto/generate-shopping.dto';

@Controller('shopping')
@UseGuards(JwtAuthGuard)
export class ShoppingController {
  constructor(private service: ShoppingService) {}

  @Get('items')
  findByWeek(
    @CurrentUser('id') userId: string,
    @Query('week') week: string,
  ) {
    return this.service.findByWeek(userId, week);
  }

  @Post('items')
  create(@CurrentUser('id') userId: string, @Body() dto: CreateShoppingItemDto) {
    return this.service.create(userId, dto);
  }

  @Patch('items/:id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShoppingItemDto,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete('items/:id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }

  @Post('generate')
  generate(@CurrentUser('id') userId: string, @Body() dto: GenerateShoppingDto) {
    return this.service.generate(userId, dto.weekStart);
  }
}
