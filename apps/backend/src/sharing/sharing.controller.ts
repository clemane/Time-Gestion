import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SharingService } from './sharing.service';
import { CreateShareDto } from './dto/create-share.dto';

@Controller('shares')
@UseGuards(JwtAuthGuard)
export class SharingController {
  constructor(private service: SharingService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateShareDto) {
    return this.service.create(userId, dto);
  }

  @Get('with-me')
  findSharedWithMe(@CurrentUser('id') userId: string) {
    return this.service.findSharedWithMe(userId);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }
}
