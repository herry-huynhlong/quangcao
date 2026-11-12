import { BadRequestException } from '@nestjs/common';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 256;
export const PASSWORD_POLICY_MESSAGE = 'Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường và số.';

export function assertPasswordPolicy(password: string) {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    throw new BadRequestException(PASSWORD_POLICY_MESSAGE);
  }
}
