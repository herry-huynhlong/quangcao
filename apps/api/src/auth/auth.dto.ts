import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
export class RegisterDto { @IsEmail() email!: string; @IsString() @Length(12, 128) password!: string; }
export class LoginDto { @IsEmail() email!: string; @IsString() @Length(1, 128) password!: string; @IsOptional() @IsString() @Length(6,6) mfaCode?: string; }
export class EmailDto { @IsEmail() email!: string; }
export class MfaConfirmDto { @IsString() @Length(6, 6) code!: string; }
export class TokenDto { @IsString() @Length(20, 256) token!: string; }
export class ResetPasswordDto extends TokenDto { @IsString() @Length(12,128) password!: string; }
export class CreateOrganizationDto { @IsString() @Length(2,120) name!: string; @IsString() @Length(2,160) legalName?: string; @IsString() @Matches(/^[0-9A-Za-z-]*$/) taxId?: string; }
