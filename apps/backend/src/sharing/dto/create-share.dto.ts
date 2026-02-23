import { IsString, IsUUID, IsEmail } from 'class-validator';

export class CreateShareDto {
  @IsString()
  resourceType!: string;

  @IsUUID()
  resourceId!: string;

  @IsEmail()
  sharedWithEmail!: string;

  @IsString()
  permission!: string;
}
