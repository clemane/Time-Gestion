import { IsString, IsOptional, IsUUID, IsDateString, IsInt } from 'class-validator';

export class UpdateMealSlotDto {
  @IsOptional()
  @IsUUID()
  recipeId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  slotName?: string;

  @IsOptional()
  @IsString()
  customTitle?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
