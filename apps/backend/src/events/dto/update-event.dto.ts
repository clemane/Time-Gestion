import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
  IsInt,
} from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsUUID()
  calendarId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  @IsInt()
  reminderMinutes?: number;

  @IsOptional()
  @IsUUID()
  noteId?: string;
}
