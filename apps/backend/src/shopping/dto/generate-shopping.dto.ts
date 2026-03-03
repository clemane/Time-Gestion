import { IsDateString } from 'class-validator';

export class GenerateShoppingDto {
  @IsDateString()
  weekStart!: string;
}
