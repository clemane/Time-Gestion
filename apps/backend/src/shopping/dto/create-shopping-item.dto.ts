import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateShoppingItemDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsDateString()
  weekStart!: string;
}
