import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_POLICY_MESSAGE } from './password-policy';

export class RegisterDto {
  @IsOptional() @IsString() @Length(2,120) fullName?: string;
  @IsEmail() email!: string;
  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[a-z]/, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[A-Z]/, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/\d/, { message: PASSWORD_POLICY_MESSAGE })
  password!: string;
}
export class LoginDto { @IsEmail() email!: string; @IsString() @Length(1, PASSWORD_MAX_LENGTH) password!: string; @IsOptional() @IsString() @Length(6,6) mfaCode?: string; }
export class EmailDto { @IsEmail() email!: string; }
export class MfaConfirmDto { @IsString() @Length(6, 6) code!: string; }
export class TokenDto { @IsString() @Length(20, 256) token!: string; }
export class ResetPasswordDto extends TokenDto {
  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[a-z]/, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/[A-Z]/, { message: PASSWORD_POLICY_MESSAGE })
  @Matches(/\d/, { message: PASSWORD_POLICY_MESSAGE })
  password!: string;
}
export class ChangePasswordDto {
  @IsString() @Length(1, PASSWORD_MAX_LENGTH) currentPassword!: string;
  @IsString() @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, { message: PASSWORD_POLICY_MESSAGE }) @Matches(/[a-z]/, { message: PASSWORD_POLICY_MESSAGE }) @Matches(/[A-Z]/, { message: PASSWORD_POLICY_MESSAGE }) @Matches(/\d/, { message: PASSWORD_POLICY_MESSAGE }) newPassword!: string;
}
export class CreateOrganizationDto { @IsString() @Length(2,120) name!: string; @IsString() @Length(2,160) legalName?: string; @IsString() @Matches(/^[0-9A-Za-z-]*$/) taxId?: string; }
export class AdminBootstrapTokenDto { @IsString() @Length(20, 256) token!: string; }
export class CompleteAdminBootstrapDto extends AdminBootstrapTokenDto {
  @IsString() @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, { message: PASSWORD_POLICY_MESSAGE }) @Matches(/[a-z]/, { message: PASSWORD_POLICY_MESSAGE }) @Matches(/[A-Z]/, { message: PASSWORD_POLICY_MESSAGE }) @Matches(/\d/, { message: PASSWORD_POLICY_MESSAGE }) password!: string;
}
