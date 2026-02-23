import { IsString, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';
import { Prisma } from '@prisma/client';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsObject()
  style?: Prisma.InputJsonValue;

  @IsOptional()
  @IsObject()
  defaultContent?: Prisma.InputJsonValue;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
