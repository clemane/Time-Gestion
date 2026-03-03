import { IsString, IsOptional, IsUUID, IsDateString, IsInt } from 'class-validator';

export class CreateMealSlotDto {
  @IsOptional()
  @IsUUID()
  recipeId?: string;

  @IsDateString()
  date!: string;

  @IsString()
  slotName!: string;

  @IsOptional()
  @IsString()
  customTitle?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
