import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnerService {
  constructor(private prisma: PrismaService) {}

  async generateInvite(userId: string) {
    await this.prisma.partnerInvite.deleteMany({ where: { userId } });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    return this.prisma.partnerInvite.create({
      data: { userId, code, expiresAt },
    });
  }

  async joinPartner(userId: string, code: string) {
    const invite = await this.prisma.partnerInvite.findUnique({ where: { code } });
    if (!invite) throw new NotFoundException('Code invalide');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Code expiré');
    if (invite.userId === userId) throw new BadRequestException('Vous ne pouvez pas vous inviter vous-même');

    // Check neither user already has a partner
    const [user, inviter] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: invite.userId } }),
    ]);
    if (user?.partnerId) throw new BadRequestException('Vous avez déjà un partenaire');
    if (inviter?.partnerId) throw new BadRequestException('Cette personne a déjà un partenaire');

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { partnerId: invite.userId } }),
      this.prisma.user.update({ where: { id: invite.userId }, data: { partnerId: userId } }),
      this.prisma.partnerInvite.delete({ where: { id: invite.id } }),
    ]);

    return { partnerId: invite.userId };
  }

  async getPartner(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { partner: { select: { id: true, displayName: true, email: true } } },
    });
    return user?.partner || null;
  }

  async unlinkPartner(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.partnerId) throw new BadRequestException('Pas de partenaire');
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { partnerId: null } }),
      this.prisma.user.update({ where: { id: user.partnerId }, data: { partnerId: null } }),
    ]);
  }
}
