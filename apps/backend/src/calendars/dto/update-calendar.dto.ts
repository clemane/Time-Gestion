import { IsString, IsOptional, Matches } from 'class-validator';

export class UpdateCalendarDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a valid hex color (e.g. #FF0000)',
  })
  color?: string;
}
