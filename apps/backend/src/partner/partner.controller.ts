import { Controller, Post, Get, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PartnerService } from './partner.service';
import { JoinPartnerDto } from './dto/join-partner.dto';

@Controller('partner')
@UseGuards(AuthGuard('jwt'))
export class PartnerController {
  constructor(private partnerService: PartnerService) {}

  @Post('invite')
  generateInvite(@Request() req) {
    return this.partnerService.generateInvite(req.user.id);
  }

  @Post('join')
  joinPartner(@Request() req, @Body() dto: JoinPartnerDto) {
    return this.partnerService.joinPartner(req.user.id, dto.code);
  }

  @Get()
  getPartner(@Request() req) {
    return this.partnerService.getPartner(req.user.id);
  }

  @Delete()
  unlinkPartner(@Request() req) {
    return this.partnerService.unlinkPartner(req.user.id);
  }
}
