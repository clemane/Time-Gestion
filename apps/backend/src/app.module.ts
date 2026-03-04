import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FoldersModule } from './folders/folders.module';
import { CategoriesModule } from './categories/categories.module';
import { NotesModule } from './notes/notes.module';
import { CalendarsModule } from './calendars/calendars.module';
import { EventsModule } from './events/events.module';
import { SharingModule } from './sharing/sharing.module';
import { SyncModule } from './sync/sync.module';
import { RecipesModule } from './recipes/recipes.module';
import { MealPlansModule } from './meal-plans/meal-plans.module';
import { ShoppingModule } from './shopping/shopping.module';
import { PartnerModule } from './partner/partner.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    FoldersModule,
    CategoriesModule,
    NotesModule,
    CalendarsModule,
    EventsModule,
    SharingModule,
    SyncModule,
    RecipesModule,
    MealPlansModule,
    ShoppingModule,
    PartnerModule,
  ],
})
export class AppModule {}
