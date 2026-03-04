import { IsString, Length } from 'class-validator';

export class JoinPartnerDto {
  @IsString()
  @Length(6, 6)
  code!: string;
}
