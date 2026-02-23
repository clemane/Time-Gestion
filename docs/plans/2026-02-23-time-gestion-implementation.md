# Time Gestion - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an offline-first PWA combining Apple Notes-style note management with a full calendar system, supporting multi-user auth and sharing.

**Architecture:** Monorepo (pnpm workspaces) with Vue 3 frontend + NestJS backend + PostgreSQL. IndexedDB (Dexie.js) as primary client store with sync queue pushing to REST API. TipTap for rich text editing. JWT auth with httpOnly refresh tokens.

**Tech Stack:** Vue 3, TypeScript, Vite, Pinia, Dexie.js, TipTap, NestJS, Prisma, PostgreSQL, vite-plugin-pwa, Docker

---

## Phase 1: Project Scaffolding & Infrastructure

### Task 1: Initialize monorepo with pnpm workspaces

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.nvmrc`
- Create: `tsconfig.base.json`

**Step 1: Create root package.json**

```json
{
  "name": "time-gestion",
  "private": true,
  "scripts": {
    "dev:backend": "pnpm --filter backend dev",
    "dev:frontend": "pnpm --filter frontend dev",
    "dev": "pnpm run --parallel dev:backend dev:frontend",
    "build": "pnpm run --parallel build:backend build:frontend",
    "build:backend": "pnpm --filter backend build",
    "build:frontend": "pnpm --filter frontend build",
    "test": "pnpm run --recursive test",
    "lint": "pnpm run --recursive lint"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=10.0.0"
  }
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
coverage/
.turbo/
```

**Step 4: Create .nvmrc**

```
25
```

**Step 5: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Step 6: Run pnpm install**

Run: `pnpm install`

**Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore .nvmrc tsconfig.base.json
git commit -m "chore: initialize monorepo with pnpm workspaces"
```

---

### Task 2: Create shared types package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/note.ts`
- Create: `packages/shared/src/types/folder.ts`
- Create: `packages/shared/src/types/category.ts`
- Create: `packages/shared/src/types/calendar.ts`
- Create: `packages/shared/src/types/event.ts`
- Create: `packages/shared/src/types/share.ts`
- Create: `packages/shared/src/types/sync.ts`

**Step 1: Create packages/shared/package.json**

```json
{
  "name": "@time-gestion/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

**Step 2: Create packages/shared/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

**Step 3: Create all type files**

`packages/shared/src/types/user.ts`:
```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
```

`packages/shared/src/types/folder.ts`:
```typescript
export interface Folder {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateFolderDto {
  name: string;
  parentId?: string;
}

export interface UpdateFolderDto {
  name?: string;
  parentId?: string | null;
  sortOrder?: number;
}
```

`packages/shared/src/types/category.ts`:
```typescript
export interface CategoryStyle {
  backgroundColor: string;
  lineStyle: 'none' | 'lined' | 'grid';
  fontFamily: string;
  fontSize: number;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  style: CategoryStyle;
  defaultContent: Record<string, unknown> | null;
  isDefault: boolean;
  sortOrder: number;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCategoryDto {
  name: string;
  icon?: string;
  style: CategoryStyle;
  defaultContent?: Record<string, unknown>;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string | null;
  style?: Partial<CategoryStyle>;
  defaultContent?: Record<string, unknown> | null;
  sortOrder?: number;
}
```

`packages/shared/src/types/note.ts`:
```typescript
export interface Note {
  id: string;
  userId: string;
  folderId: string | null;
  categoryId: string | null;
  title: string;
  content: Record<string, unknown>;
  isPinned: boolean;
  scheduledDate: string | null;
  scheduledTime: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateNoteDto {
  title: string;
  content?: Record<string, unknown>;
  folderId?: string;
  categoryId?: string;
  isPinned?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: Record<string, unknown>;
  folderId?: string | null;
  categoryId?: string | null;
  isPinned?: boolean;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
}
```

`packages/shared/src/types/calendar.ts`:
```typescript
export interface Calendar {
  id: string;
  userId: string;
  name: string;
  color: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateCalendarDto {
  name: string;
  color: string;
}

export interface UpdateCalendarDto {
  name?: string;
  color?: string;
}
```

`packages/shared/src/types/event.ts`:
```typescript
export interface CalendarEvent {
  id: string;
  calendarId: string;
  userId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  recurrenceRule: string | null;
  reminderMinutes: number | null;
  noteId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateEventDto {
  calendarId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  recurrenceRule?: string;
  reminderMinutes?: number;
  noteId?: string;
}

export interface UpdateEventDto {
  calendarId?: string;
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  recurrenceRule?: string | null;
  reminderMinutes?: number | null;
  noteId?: string | null;
}
```

`packages/shared/src/types/share.ts`:
```typescript
export type ResourceType = 'NOTE' | 'FOLDER' | 'CALENDAR';
export type Permission = 'READ' | 'WRITE';

export interface Share {
  id: string;
  resourceType: ResourceType;
  resourceId: string;
  ownerId: string;
  sharedWithId: string;
  permission: Permission;
  createdAt: string;
}

export interface CreateShareDto {
  resourceType: ResourceType;
  resourceId: string;
  sharedWithEmail: string;
  permission: Permission;
}
```

`packages/shared/src/types/sync.ts`:
```typescript
export type SyncAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncEntity = 'note' | 'folder' | 'category' | 'calendar' | 'event' | 'share';

export interface SyncOperation {
  id: string;
  entity: SyncEntity;
  entityId: string;
  action: SyncAction;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SyncPushRequest {
  operations: SyncOperation[];
}

export interface SyncPushResponse {
  results: Array<{
    operationId: string;
    success: boolean;
    serverEntity?: Record<string, unknown>;
    error?: string;
  }>;
}

export interface SyncPullResponse {
  changes: Array<{
    entity: SyncEntity;
    entityId: string;
    action: SyncAction;
    data: Record<string, unknown>;
    updatedAt: string;
  }>;
  syncedAt: string;
}
```

`packages/shared/src/index.ts`:
```typescript
export * from './types/user';
export * from './types/note';
export * from './types/folder';
export * from './types/category';
export * from './types/calendar';
export * from './types/event';
export * from './types/share';
export * from './types/sync';
```

**Step 4: Run pnpm install from root**

Run: `pnpm install`

**Step 5: Typecheck**

Run: `pnpm --filter @time-gestion/shared typecheck`
Expected: No errors

**Step 6: Commit**

```bash
git add packages/
git commit -m "feat: add shared types package with all domain types"
```

---

### Task 3: Scaffold NestJS backend

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/tsconfig.build.json`
- Create: `apps/backend/nest-cli.json`
- Create: `apps/backend/src/main.ts`
- Create: `apps/backend/src/app.module.ts`
- Create: `apps/backend/.env.example`
- Create: `apps/backend/test/jest-e2e.json`

**Step 1: Create apps/backend/package.json**

```json
{
  "name": "backend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "nest start",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@prisma/client": "^6.0.0",
    "@time-gestion/shared": "workspace:*",
    "bcrypt": "^6.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "cookie-parser": "^1.4.7",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.7",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.0.0",
    "@types/passport-jwt": "^4.0.1",
    "jest": "^29.7.0",
    "prisma": "^6.0.0",
    "source-map-support": "^0.5.21",
    "ts-jest": "^29.2.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1"
    }
  }
}
```

**Step 2: Create apps/backend/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "commonjs",
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Step 3: Create apps/backend/tsconfig.build.json**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

**Step 4: Create apps/backend/nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

**Step 5: Create apps/backend/src/main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
```

**Step 6: Create apps/backend/src/app.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class AppModule {}
```

**Step 7: Create apps/backend/.env.example**

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/time_gestion?schema=public"
JWT_SECRET="change-me-in-production"
JWT_REFRESH_SECRET="change-me-in-production-refresh"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"
FRONTEND_URL="http://localhost:5173"
PORT=3000
```

**Step 8: Create apps/backend/test/jest-e2e.json**

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

**Step 9: Install backend dependencies**

Run: `cd apps/backend && pnpm install && cd ../..`

**Step 10: Verify backend compiles**

Run: `pnpm --filter backend build`
Expected: Build successful

**Step 11: Commit**

```bash
git add apps/backend/
git commit -m "feat: scaffold NestJS backend with config and validation"
```

---

### Task 4: Set up Prisma schema and Docker PostgreSQL

**Files:**
- Create: `docker-compose.yml`
- Create: `apps/backend/prisma/schema.prisma`

**Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: time_gestion
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Step 2: Create apps/backend/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  passwordHash String   @map("password_hash")
  displayName  String   @map("display_name")
  avatarUrl    String?  @map("avatar_url")
  createdAt    DateTime @default(now()) @map("created_at")

  notes      Note[]
  folders    Folder[]
  categories Category[]
  calendars  Calendar[]
  events     CalendarEvent[]
  ownedShares    Share[] @relation("ShareOwner")
  receivedShares Share[] @relation("ShareReceiver")

  @@map("users")
}

model Folder {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  parentId  String?   @map("parent_id") @db.Uuid
  name      String
  sortOrder Int       @default(0) @map("sort_order")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent   Folder?  @relation("FolderTree", fields: [parentId], references: [id])
  children Folder[] @relation("FolderTree")
  notes    Note[]

  @@map("folders")
}

model Category {
  id             String    @id @default(uuid()) @db.Uuid
  userId         String    @map("user_id") @db.Uuid
  name           String
  icon           String?
  style          Json
  defaultContent Json?     @map("default_content")
  isDefault      Boolean   @default(false) @map("is_default")
  sortOrder      Int       @default(0) @map("sort_order")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  notes Note[]

  @@map("categories")
}

model Note {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @map("user_id") @db.Uuid
  folderId      String?   @map("folder_id") @db.Uuid
  categoryId    String?   @map("category_id") @db.Uuid
  title         String
  content       Json      @default("{}")
  isPinned      Boolean   @default(false) @map("is_pinned")
  scheduledDate DateTime? @map("scheduled_date") @db.Date
  scheduledTime String?   @map("scheduled_time") @db.VarChar(5)
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  folder   Folder?   @relation(fields: [folderId], references: [id])
  category Category? @relation(fields: [categoryId], references: [id])
  events   CalendarEvent[]

  @@map("notes")
}

model Calendar {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  name      String
  color     String    @db.VarChar(7)
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  user   User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  events CalendarEvent[]

  @@map("calendars")
}

model CalendarEvent {
  id              String    @id @default(uuid()) @db.Uuid
  calendarId      String    @map("calendar_id") @db.Uuid
  userId          String    @map("user_id") @db.Uuid
  title           String
  description     String?
  startAt         DateTime  @map("start_at")
  endAt           DateTime  @map("end_at")
  allDay          Boolean   @default(false) @map("all_day")
  recurrenceRule  String?   @map("recurrence_rule")
  reminderMinutes Int?      @map("reminder_minutes")
  noteId          String?   @map("note_id") @db.Uuid
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  calendar Calendar @relation(fields: [calendarId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  note     Note?    @relation(fields: [noteId], references: [id])

  @@map("calendar_events")
}

model Share {
  id           String   @id @default(uuid()) @db.Uuid
  resourceType String   @map("resource_type")
  resourceId   String   @map("resource_id") @db.Uuid
  ownerId      String   @map("owner_id") @db.Uuid
  sharedWithId String   @map("shared_with_id") @db.Uuid
  permission   String
  createdAt    DateTime @default(now()) @map("created_at")

  owner      User @relation("ShareOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  sharedWith User @relation("ShareReceiver", fields: [sharedWithId], references: [id], onDelete: Cascade)

  @@unique([resourceType, resourceId, sharedWithId])
  @@map("shares")
}
```

**Step 3: Create .env from example**

Run: `cp apps/backend/.env.example apps/backend/.env`

**Step 4: Start PostgreSQL**

Run: `docker compose up -d`

**Step 5: Generate Prisma client and run migration**

Run: `cd apps/backend && pnpm db:generate && pnpm db:migrate --name init && cd ../..`

**Step 6: Create PrismaModule**

Create `apps/backend/src/prisma/prisma.module.ts`:
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

Create `apps/backend/src/prisma/prisma.service.ts`:
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Step 7: Add PrismaModule to AppModule**

Update `apps/backend/src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
  ],
})
export class AppModule {}
```

**Step 8: Verify backend starts**

Run: `pnpm --filter backend dev` (start then Ctrl+C after confirming it starts)

**Step 9: Commit**

```bash
git add docker-compose.yml apps/backend/prisma/ apps/backend/src/prisma/ apps/backend/src/app.module.ts
git commit -m "feat: add Prisma schema with all models and Docker PostgreSQL"
```

---

## Phase 2: Backend Auth Module

### Task 5: Implement auth module (register, login, refresh)

**Files:**
- Create: `apps/backend/src/auth/auth.module.ts`
- Create: `apps/backend/src/auth/auth.controller.ts`
- Create: `apps/backend/src/auth/auth.service.ts`
- Create: `apps/backend/src/auth/dto/register.dto.ts`
- Create: `apps/backend/src/auth/dto/login.dto.ts`
- Create: `apps/backend/src/auth/strategies/jwt.strategy.ts`
- Create: `apps/backend/src/auth/strategies/jwt-refresh.strategy.ts`
- Create: `apps/backend/src/auth/guards/jwt-auth.guard.ts`
- Create: `apps/backend/src/auth/guards/jwt-refresh.guard.ts`
- Create: `apps/backend/src/auth/decorators/current-user.decorator.ts`
- Test: `apps/backend/src/auth/auth.service.spec.ts`
- Test: `apps/backend/src/auth/auth.controller.spec.ts`

**Step 1: Write auth.service.spec.ts (failing test)**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user and return tokens', async () => {
      const dto = { email: 'test@test.com', password: 'password123', displayName: 'Test' };
      const hashedPassword = 'hashed-password';
      const user = { id: 'uuid-1', email: dto.email, displayName: dto.displayName, avatarUrl: null, createdAt: new Date() };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(user);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

      const result = await service.register(dto);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'test@test.com', password: 'pass', displayName: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const user = { id: 'uuid-1', email: 'test@test.com', passwordHash: 'hashed', displayName: 'Test', avatarUrl: null, createdAt: new Date() };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

      const result = await service.login({ email: 'test@test.com', password: 'password123' });

      expect(result.accessToken).toBe('access-token');
      expect(result.user.email).toBe('test@test.com');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter backend test -- --testPathPattern=auth.service.spec`
Expected: FAIL

**Step 3: Implement auth DTOs**

`apps/backend/src/auth/dto/register.dto.ts`:
```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(1)
  displayName: string;
}
```

`apps/backend/src/auth/dto/login.dto.ts`:
```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

**Step 4: Implement AuthService**

```typescript
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl, createdAt: user.createdAt.toISOString() },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl, createdAt: user.createdAt.toISOString() },
    };
  }

  async refreshTokens(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl, createdAt: user.createdAt.toISOString() },
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
```

**Step 5: Run test to verify it passes**

Run: `pnpm --filter backend test -- --testPathPattern=auth.service.spec`
Expected: PASS

**Step 6: Implement JWT strategies, guards, and decorator**

`apps/backend/src/auth/strategies/jwt.strategy.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
```

`apps/backend/src/auth/strategies/jwt-refresh.strategy.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refreshToken,
      ]),
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
    });
  }

  validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
```

`apps/backend/src/auth/guards/jwt-auth.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

`apps/backend/src/auth/guards/jwt-refresh.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
```

`apps/backend/src/auth/decorators/current-user.decorator.ts`:
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
```

**Step 7: Implement AuthController**

`apps/backend/src/auth/auth.controller.ts`:
```typescript
import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.register(dto);
    this.setRefreshTokenCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(dto);
    this.setRefreshTokenCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(@CurrentUser('id') userId: string, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.refreshTokens(userId);
    this.setRefreshTokenCookie(res, refreshToken);
    return { accessToken, user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken');
    return { message: 'Logged out' };
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
```

**Step 8: Create AuthModule and wire into AppModule**

`apps/backend/src/auth/auth.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

Add `AuthModule` to `AppModule` imports.

**Step 9: Run all tests**

Run: `pnpm --filter backend test`
Expected: All PASS

**Step 10: Commit**

```bash
git add apps/backend/src/auth/
git commit -m "feat: implement auth module with JWT, register, login, refresh"
```

---

## Phase 3: Backend CRUD Modules

### Task 6: Implement folders CRUD module

**Files:**
- Create: `apps/backend/src/folders/folders.module.ts`
- Create: `apps/backend/src/folders/folders.controller.ts`
- Create: `apps/backend/src/folders/folders.service.ts`
- Create: `apps/backend/src/folders/dto/create-folder.dto.ts`
- Create: `apps/backend/src/folders/dto/update-folder.dto.ts`
- Test: `apps/backend/src/folders/folders.service.spec.ts`

**Pattern for all CRUD modules (Tasks 6-10):**

Each CRUD module follows the exact same pattern:
1. Write service spec with mocked Prisma
2. Run test → FAIL
3. Implement DTOs with class-validator
4. Implement service with Prisma queries (soft delete via `deletedAt`, always filter `deletedAt: null`)
5. Run test → PASS
6. Implement controller with `@UseGuards(JwtAuthGuard)` and `@CurrentUser('id')`
7. Create module, register in AppModule
8. Run tests → all PASS
9. Commit

**Service implementation pattern (folders as example):**

```typescript
@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(userId: string, dto: CreateFolderDto) {
    return this.prisma.folder.create({
      data: { ...dto, userId },
    });
  }

  async update(userId: string, id: string, dto: UpdateFolderDto) {
    const folder = await this.prisma.folder.findFirst({ where: { id, userId, deletedAt: null } });
    if (!folder) throw new NotFoundException('Folder not found');
    return this.prisma.folder.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const folder = await this.prisma.folder.findFirst({ where: { id, userId, deletedAt: null } });
    if (!folder) throw new NotFoundException('Folder not found');
    return this.prisma.folder.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
```

**Controller pattern:**
```typescript
@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) { return this.foldersService.findAll(userId); }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateFolderDto) { return this.foldersService.create(userId, dto); }

  @Patch(':id')
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateFolderDto) { return this.foldersService.update(userId, id, dto); }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.foldersService.remove(userId, id); }
}
```

Commit: `git commit -m "feat: implement folders CRUD module"`

### Task 7: Implement categories CRUD module

Same pattern as Task 6 but for categories. Include `style` JSON validation. Commit: `git commit -m "feat: implement categories CRUD module"`

### Task 8: Implement notes CRUD module

Same pattern as Task 6 but for notes. Add filters for `folderId`, `categoryId`, full-text search on `title`. Include `GET /notes` with query params: `?folderId=&categoryId=&search=&pinned=`. Commit: `git commit -m "feat: implement notes CRUD module"`

### Task 9: Implement calendars CRUD module

Same pattern as Task 6 but for calendars. Commit: `git commit -m "feat: implement calendars CRUD module"`

### Task 10: Implement events CRUD module

Same pattern as Task 6 but for events. Add filters for `calendarId` and date range (`?from=&to=`). Commit: `git commit -m "feat: implement events CRUD module"`

### Task 11: Implement sharing module

**Files:**
- Create: `apps/backend/src/sharing/sharing.module.ts`
- Create: `apps/backend/src/sharing/sharing.controller.ts`
- Create: `apps/backend/src/sharing/sharing.service.ts`
- Create: `apps/backend/src/sharing/dto/create-share.dto.ts`
- Test: `apps/backend/src/sharing/sharing.service.spec.ts`

**Key logic:**
- `POST /shares` — look up `sharedWithEmail` to find user, create share record
- `GET /shares/with-me` — return all shares where `sharedWithId = currentUser`
- `DELETE /shares/:id` — only owner can remove a share
- Modify notes/events/folders/calendars services to also return shared resources (join on shares table)

Commit: `git commit -m "feat: implement sharing module with permission checks"`

### Task 12: Implement sync endpoints

**Files:**
- Create: `apps/backend/src/sync/sync.module.ts`
- Create: `apps/backend/src/sync/sync.controller.ts`
- Create: `apps/backend/src/sync/sync.service.ts`
- Test: `apps/backend/src/sync/sync.service.spec.ts`

**Key logic:**

`POST /sync/push`:
```typescript
async pushChanges(userId: string, operations: SyncOperation[]) {
  const results = [];
  for (const op of operations) {
    try {
      const result = await this.applyOperation(userId, op);
      results.push({ operationId: op.id, success: true, serverEntity: result });
    } catch (error) {
      results.push({ operationId: op.id, success: false, error: error.message });
    }
  }
  return { results };
}
```

`GET /sync/pull?since=<timestamp>`:
```typescript
async pullChanges(userId: string, since: string) {
  const sinceDate = new Date(since);
  // Query all entities updated after sinceDate for this user (including shared)
  // Return unified list of changes
}
```

Commit: `git commit -m "feat: implement sync push/pull endpoints"`

---

## Phase 4: Frontend Scaffolding

### Task 13: Scaffold Vue 3 frontend with Vite + PWA

**Files:**
- Create: `apps/frontend/package.json`
- Create: `apps/frontend/vite.config.ts`
- Create: `apps/frontend/tsconfig.json`
- Create: `apps/frontend/tsconfig.app.json`
- Create: `apps/frontend/index.html`
- Create: `apps/frontend/src/main.ts`
- Create: `apps/frontend/src/App.vue`
- Create: `apps/frontend/src/router/index.ts`
- Create: `apps/frontend/env.d.ts`

**Step 1: Create apps/frontend/package.json**

```json
{
  "name": "frontend",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@tiptap/extension-image": "^2.11.0",
    "@tiptap/extension-placeholder": "^2.11.0",
    "@tiptap/extension-table": "^2.11.0",
    "@tiptap/extension-table-cell": "^2.11.0",
    "@tiptap/extension-table-header": "^2.11.0",
    "@tiptap/extension-table-row": "^2.11.0",
    "@tiptap/extension-task-item": "^2.11.0",
    "@tiptap/extension-task-list": "^2.11.0",
    "@tiptap/pm": "^2.11.0",
    "@tiptap/starter-kit": "^2.11.0",
    "@tiptap/vue-3": "^2.11.0",
    "@time-gestion/shared": "workspace:*",
    "dexie": "^4.0.0",
    "pinia": "^3.0.0",
    "vue": "^3.5.0",
    "vue-router": "^4.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vite-plugin-pwa": "^0.21.0",
    "vitest": "^3.0.0",
    "vue-tsc": "^2.2.0"
  }
}
```

**Step 2: Create vite.config.ts with PWA**

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Time Gestion',
        short_name: 'TimeGestion',
        description: 'Notes & Calendar app',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

**Step 3: Create index.html, App.vue, main.ts, router with basic views**

Create the basic routing structure:
- `/` → redirect to `/notes`
- `/login` → LoginView
- `/register` → RegisterView
- `/notes` → NotesView
- `/notes/:id` → NoteDetailView
- `/calendar` → CalendarView
- `/search` → SearchView
- `/settings` → SettingsView

**Step 4: Install and verify**

Run: `pnpm install && pnpm --filter frontend dev` (verify it starts)

**Step 5: Commit**

```bash
git add apps/frontend/
git commit -m "feat: scaffold Vue 3 frontend with Vite, PWA, and routing"
```

---

### Task 14: Set up Dexie.js (IndexedDB) database

**Files:**
- Create: `apps/frontend/src/db/index.ts`
- Create: `apps/frontend/src/db/schema.ts`

**Step 1: Create the Dexie database**

`apps/frontend/src/db/schema.ts`:
```typescript
import Dexie, { type Table } from 'dexie';
import type { Note, Folder, Category, Calendar, CalendarEvent, Share } from '@time-gestion/shared';

interface SyncQueueItem {
  id?: number;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: string;
}

interface SyncMeta {
  key: string;
  value: string;
}

export class TimeGestionDB extends Dexie {
  notes!: Table<Note & { _localId?: number }>;
  folders!: Table<Folder & { _localId?: number }>;
  categories!: Table<Category & { _localId?: number }>;
  calendars!: Table<Calendar & { _localId?: number }>;
  events!: Table<CalendarEvent & { _localId?: number }>;
  shares!: Table<Share>;
  syncQueue!: Table<SyncQueueItem>;
  syncMeta!: Table<SyncMeta>;

  constructor() {
    super('time-gestion');

    this.version(1).stores({
      notes: 'id, userId, folderId, categoryId, isPinned, scheduledDate, updatedAt, deletedAt',
      folders: 'id, userId, parentId, updatedAt, deletedAt',
      categories: 'id, userId, updatedAt, deletedAt',
      calendars: 'id, userId, updatedAt, deletedAt',
      events: 'id, calendarId, userId, startAt, endAt, noteId, updatedAt, deletedAt',
      shares: 'id, resourceType, resourceId, ownerId, sharedWithId',
      syncQueue: '++id, entity, entityId, timestamp',
      syncMeta: 'key',
    });
  }
}

export const db = new TimeGestionDB();
```

**Step 2: Commit**

```bash
git add apps/frontend/src/db/
git commit -m "feat: set up Dexie.js IndexedDB schema"
```

---

### Task 15: Implement API client and auth store

**Files:**
- Create: `apps/frontend/src/api/client.ts`
- Create: `apps/frontend/src/stores/auth.ts`

**Step 1: Create API client with token management**

`apps/frontend/src/api/client.ts`:
```typescript
const BASE_URL = '/api';
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && accessToken) {
    // Try refresh
    const refreshed = await refreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retry = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: 'include' });
      if (!retry.ok) throw new Error(`API error: ${retry.status}`);
      return retry.json();
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.accessToken;
    return true;
  } catch {
    return false;
  }
}
```

**Step 2: Create auth Pinia store**

`apps/frontend/src/stores/auth.ts`:
```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, AuthResponse } from '@time-gestion/shared';
import { apiFetch, setAccessToken } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => !!user.value);

  async function register(email: string, password: string, displayName: string) {
    const data = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    setAccessToken(data.accessToken);
    user.value = data.user;
  }

  async function login(email: string, password: string) {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    user.value = data.user;
  }

  async function refresh() {
    try {
      const data = await apiFetch<AuthResponse>('/auth/refresh', { method: 'POST' });
      setAccessToken(data.accessToken);
      user.value = data.user;
    } catch {
      user.value = null;
      setAccessToken(null);
    }
  }

  async function logout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    user.value = null;
    setAccessToken(null);
  }

  return { user, isAuthenticated, register, login, refresh, logout };
});
```

**Step 3: Commit**

```bash
git add apps/frontend/src/api/ apps/frontend/src/stores/auth.ts
git commit -m "feat: implement API client with auto-refresh and auth store"
```

---

## Phase 5: Frontend Core Features

### Task 16: Implement Pinia stores with IndexedDB sync

**Files:**
- Create: `apps/frontend/src/stores/notes.ts`
- Create: `apps/frontend/src/stores/folders.ts`
- Create: `apps/frontend/src/stores/categories.ts`
- Create: `apps/frontend/src/stores/calendars.ts`
- Create: `apps/frontend/src/stores/events.ts`

Each store follows this pattern:

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '@/db/schema';
import { apiFetch } from '@/api/client';
import type { Note, CreateNoteDto, UpdateNoteDto } from '@time-gestion/shared';

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([]);
  const loading = ref(false);

  async function loadFromLocal() {
    notes.value = await db.notes.where('deletedAt').equals('').toArray()
      .catch(() => db.notes.filter(n => !n.deletedAt).toArray());
  }

  async function create(dto: CreateNoteDto) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const note: Note = {
      id, userId: '', ...dto,
      content: dto.content || {},
      folderId: dto.folderId || null,
      categoryId: dto.categoryId || null,
      isPinned: dto.isPinned || false,
      scheduledDate: dto.scheduledDate || null,
      scheduledTime: dto.scheduledTime || null,
      createdAt: now, updatedAt: now, deletedAt: null,
    };

    await db.notes.put(note);
    await db.syncQueue.add({
      entity: 'note', entityId: id, action: 'CREATE',
      payload: dto as Record<string, unknown>, timestamp: now,
    });

    notes.value.push(note);
    return note;
  }

  async function update(id: string, dto: UpdateNoteDto) {
    const now = new Date().toISOString();
    await db.notes.update(id, { ...dto, updatedAt: now });
    await db.syncQueue.add({
      entity: 'note', entityId: id, action: 'UPDATE',
      payload: dto as Record<string, unknown>, timestamp: now,
    });

    const idx = notes.value.findIndex(n => n.id === id);
    if (idx >= 0) Object.assign(notes.value[idx], dto, { updatedAt: now });
  }

  async function remove(id: string) {
    const now = new Date().toISOString();
    await db.notes.update(id, { deletedAt: now, updatedAt: now });
    await db.syncQueue.add({
      entity: 'note', entityId: id, action: 'DELETE',
      payload: {}, timestamp: now,
    });
    notes.value = notes.value.filter(n => n.id !== id);
  }

  return { notes, loading, loadFromLocal, create, update, remove };
});
```

Repeat for folders, categories, calendars, events with appropriate fields.

Commit: `git commit -m "feat: implement Pinia stores with IndexedDB write-through"`

---

### Task 17: Implement sync engine

**Files:**
- Create: `apps/frontend/src/sync/engine.ts`
- Create: `apps/frontend/src/sync/online.ts`
- Create: `apps/frontend/src/composables/useSync.ts`

**Key logic:**

`apps/frontend/src/sync/engine.ts`:
```typescript
import { db } from '@/db/schema';
import { apiFetch } from '@/api/client';
import type { SyncPushRequest, SyncPushResponse, SyncPullResponse } from '@time-gestion/shared';

export async function pushPendingChanges() {
  const pending = await db.syncQueue.orderBy('id').toArray();
  if (pending.length === 0) return;

  const operations = pending.map(op => ({
    id: String(op.id),
    entity: op.entity as any,
    entityId: op.entityId,
    action: op.action as any,
    payload: op.payload,
    timestamp: op.timestamp,
  }));

  const response = await apiFetch<SyncPushResponse>('/sync/push', {
    method: 'POST',
    body: JSON.stringify({ operations } satisfies SyncPushRequest),
  });

  // Remove successfully pushed operations from queue
  const successIds = response.results
    .filter(r => r.success)
    .map(r => Number(r.operationId));
  await db.syncQueue.bulkDelete(successIds);
}

export async function pullRemoteChanges() {
  const meta = await db.syncMeta.get('lastSync');
  const since = meta?.value || new Date(0).toISOString();

  const response = await apiFetch<SyncPullResponse>(`/sync/pull?since=${since}`);

  for (const change of response.changes) {
    const table = db.table(change.entity + 's');
    if (change.action === 'DELETE') {
      await table.delete(change.entityId);
    } else {
      await table.put({ ...change.data, id: change.entityId });
    }
  }

  await db.syncMeta.put({ key: 'lastSync', value: response.syncedAt });
}
```

`apps/frontend/src/sync/online.ts`:
```typescript
import { ref } from 'vue';

export const isOnline = ref(navigator.onLine);

window.addEventListener('online', () => { isOnline.value = true; });
window.addEventListener('offline', () => { isOnline.value = false; });
```

`apps/frontend/src/composables/useSync.ts`:
```typescript
import { watch } from 'vue';
import { isOnline } from '@/sync/online';
import { pushPendingChanges, pullRemoteChanges } from '@/sync/engine';

export function useSync() {
  let syncInterval: ReturnType<typeof setInterval> | null = null;

  async function sync() {
    if (!isOnline.value) return;
    await pushPendingChanges().catch(console.error);
    await pullRemoteChanges().catch(console.error);
  }

  function startSync() {
    sync();
    syncInterval = setInterval(sync, 30_000); // Sync every 30s
  }

  function stopSync() {
    if (syncInterval) clearInterval(syncInterval);
  }

  // Sync immediately when coming back online
  watch(isOnline, (online) => {
    if (online) sync();
  });

  return { sync, startSync, stopSync, isOnline };
}
```

Commit: `git commit -m "feat: implement offline sync engine with push/pull"`

---

### Task 18: Build mobile shell layout with bottom navigation

**Files:**
- Create: `apps/frontend/src/components/layout/AppShell.vue`
- Create: `apps/frontend/src/components/layout/BottomNav.vue`
- Modify: `apps/frontend/src/App.vue`

**AppShell.vue** — wrapper with bottom nav, slot for content, online/offline indicator
**BottomNav.vue** — 4 tabs: Notes, Calendar, Search, Settings with icons

Use CSS custom properties for theming. Mobile-first layout with `max-width: 100vw`, `height: 100dvh`.

Commit: `git commit -m "feat: build mobile app shell with bottom navigation"`

---

### Task 19: Build auth views (login + register)

**Files:**
- Create: `apps/frontend/src/views/LoginView.vue`
- Create: `apps/frontend/src/views/RegisterView.vue`

Simple forms with email/password, mobile-optimized. Use auth store. Redirect to `/notes` on success. Add route guard to protect authenticated routes.

Commit: `git commit -m "feat: implement login and register views"`

---

## Phase 6: Notes Feature (Frontend)

### Task 20: Build notes list view

**Files:**
- Create: `apps/frontend/src/views/NotesView.vue`
- Create: `apps/frontend/src/components/notes/NoteCard.vue`
- Create: `apps/frontend/src/components/notes/FolderSidebar.vue`

**NotesView.vue:** List of notes as cards, folder sidebar (slide-over on mobile), FAB to create new note, pinned notes at top, search bar at top.

**NoteCard.vue:** Title, preview of content (first ~80 chars), category color indicator, date if scheduled, pinned indicator.

Commit: `git commit -m "feat: build notes list view with folder sidebar"`

### Task 21: Build TipTap rich text editor component

**Files:**
- Create: `apps/frontend/src/components/editor/NoteEditor.vue`
- Create: `apps/frontend/src/components/editor/EditorToolbar.vue`

**NoteEditor.vue:** TipTap editor with extensions (StarterKit, TaskList, TaskItem, Image, Table, Placeholder). Emits `update:content` with ProseMirror JSON. Applies category style (background, line style, font).

**EditorToolbar.vue:** Mobile-friendly toolbar at bottom of editor: bold, italic, list types, heading, image, table. Scrollable horizontally on mobile.

Commit: `git commit -m "feat: build TipTap rich text editor with mobile toolbar"`

### Task 22: Build note detail/edit view

**Files:**
- Create: `apps/frontend/src/views/NoteDetailView.vue`

Full-screen note editing. Title input at top, category selector, NoteEditor below. Auto-save on content change (debounced 1s). Schedule date picker. Pin toggle. Back navigation.

Commit: `git commit -m "feat: build note detail view with auto-save"`

### Task 23: Build category management

**Files:**
- Create: `apps/frontend/src/views/CategoryManagerView.vue`
- Create: `apps/frontend/src/components/categories/CategoryForm.vue`
- Create: `apps/frontend/src/components/categories/CategoryPreview.vue`

CRUD for categories. Style editor (background color picker, line style selector, font picker). Live preview of template.

Commit: `git commit -m "feat: build category template management"`

---

## Phase 7: Calendar Feature (Frontend)

### Task 24: Build month calendar view

**Files:**
- Create: `apps/frontend/src/views/CalendarView.vue`
- Create: `apps/frontend/src/components/calendar/MonthView.vue`
- Create: `apps/frontend/src/components/calendar/DayCell.vue`

Grid layout, month navigation, dots/indicators on days with events or scheduled notes. Tap day to see detail list below the calendar.

Commit: `git commit -m "feat: build month calendar view"`

### Task 25: Build week and agenda views

**Files:**
- Create: `apps/frontend/src/components/calendar/WeekView.vue`
- Create: `apps/frontend/src/components/calendar/AgendaView.vue`
- Modify: `apps/frontend/src/views/CalendarView.vue` (add view switcher)

**WeekView:** Hourly grid, 7 columns, events positioned by time. Swipe to navigate weeks.

**AgendaView:** Scrollable list grouped by day. Shows events and dated notes.

Add view toggle in CalendarView header (Month | Week | Agenda).

Commit: `git commit -m "feat: build week and agenda calendar views"`

### Task 26: Build event create/edit form

**Files:**
- Create: `apps/frontend/src/components/calendar/EventForm.vue`
- Create: `apps/frontend/src/views/EventDetailView.vue`

Form: title, calendar selector, start/end date+time pickers, all-day toggle, recurrence picker (none/daily/weekly/monthly/yearly/custom), reminder selector (none/5min/15min/30min/1h/1d), optional note link, description.

Commit: `git commit -m "feat: build event creation and editing form"`

---

## Phase 8: Sharing & Search

### Task 27: Build sharing UI

**Files:**
- Create: `apps/frontend/src/components/sharing/ShareDialog.vue`
- Create: `apps/frontend/src/views/SharedWithMeView.vue`
- Create: `apps/frontend/src/stores/shares.ts`

**ShareDialog:** Modal to share a note/folder/calendar. Email input for target user, permission selector (Read/Write). List current shares with remove option.

**SharedWithMeView:** Section accessible from notes/calendar showing resources shared by others.

Commit: `git commit -m "feat: build sharing dialog and shared-with-me view"`

### Task 28: Build search view

**Files:**
- Create: `apps/frontend/src/views/SearchView.vue`

Full-text search across notes (title + content text) and events (title + description). Results grouped by type. Instant search with debounce (searches IndexedDB locally).

Commit: `git commit -m "feat: build search view with local IndexedDB search"`

---

## Phase 9: PWA & Polish

### Task 29: Configure PWA notifications for event reminders

**Files:**
- Create: `apps/frontend/src/composables/useReminders.ts`
- Modify: `apps/frontend/src/main.ts` (register reminder check)

Check upcoming events periodically. Use Notification API to show reminders. Request notification permission on first calendar use.

Commit: `git commit -m "feat: add PWA notification reminders for events"`

### Task 30: Add pull-to-refresh and swipe gestures

**Files:**
- Create: `apps/frontend/src/composables/usePullToRefresh.ts`
- Create: `apps/frontend/src/composables/useSwipe.ts`

Pull-to-refresh triggers sync. Swipe left/right on calendar navigates between periods.

Commit: `git commit -m "feat: add pull-to-refresh and swipe navigation"`

### Task 31: Settings view and final polish

**Files:**
- Create: `apps/frontend/src/views/SettingsView.vue`

User profile (display name, avatar), calendar management (create/edit/delete calendars with colors), logout button. Dark mode toggle (CSS custom properties).

Final commit: `git commit -m "feat: add settings view and complete PWA polish"`

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Project scaffolding, shared types, NestJS + Prisma + Docker |
| 2 | 5 | Auth module (JWT, register, login, refresh) |
| 3 | 6-12 | All backend CRUD modules + sharing + sync |
| 4 | 13-15 | Frontend scaffold, IndexedDB, API client, auth store |
| 5 | 16-19 | Pinia stores, sync engine, app shell, auth views |
| 6 | 20-23 | Notes: list, editor, detail, categories |
| 7 | 24-26 | Calendar: month, week, agenda, event form |
| 8 | 27-28 | Sharing UI, search |
| 9 | 29-31 | PWA notifications, gestures, settings, polish |
