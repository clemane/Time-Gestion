import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsObject,
  IsDateString,
} from 'class-validator';
import { Prisma } from '@prisma/client';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  content?: Prisma.InputJsonValue;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;
}
