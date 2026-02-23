import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
  IsInt,
} from 'class-validator';

export class CreateEventDto {
  @IsUUID()
  calendarId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

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
