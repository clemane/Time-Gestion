import { Controller, Post, Get, Delete, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PartnerService } from './partner.service';
import { JoinPartnerDto } from './dto/join-partner.dto';

@Controller('partner')
@UseGuards(JwtAuthGuard)
export class PartnerController {
  constructor(private partnerService: PartnerService) {}

  @Post('invite')
  generateInvite(@CurrentUser('id') userId: string) {
    return this.partnerService.generateInvite(userId);
  }

  @Post('join')
  joinPartner(@CurrentUser('id') userId: string, @Body() dto: JoinPartnerDto) {
    return this.partnerService.joinPartner(userId, dto.code);
  }

  @Get()
  getPartner(@CurrentUser('id') userId: string) {
    return this.partnerService.getPartner(userId);
  }

  @Delete()
  unlinkPartner(@CurrentUser('id') userId: string) {
    return this.partnerService.unlinkPartner(userId);
  }
}
