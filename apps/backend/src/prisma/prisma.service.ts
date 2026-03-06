import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(retries = 5, delay = 3000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected');
        return;
      } catch (err) {
        this.logger.warn(`DB connection attempt ${attempt}/${retries} failed, retrying in ${delay / 1000}s...`);
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
