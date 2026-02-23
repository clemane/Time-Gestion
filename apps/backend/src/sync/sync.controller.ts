import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SyncService, SyncOperation } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private service: SyncService) {}

  @Post('push')
  push(
    @CurrentUser('id') userId: string,
    @Body() body: { operations: SyncOperation[] },
  ) {
    return this.service.pushChanges(userId, body.operations);
  }

  @Get('pull')
  pull(
    @CurrentUser('id') userId: string,
    @Query('since') since: string,
  ) {
    return this.service.pullChanges(userId, since);
  }
}
