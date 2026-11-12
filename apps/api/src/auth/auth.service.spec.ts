import { BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService password policy', () => {
  const service = new AuthService({} as never, {} as never);
  const assertPassword = (value: string) => (service as never as { assertPassword: (password: string) => void }).assertPassword(value);

  it('accepts an eight-character password with upper, lower, and a number', () => {
    expect(() => assertPassword('Valid123')).not.toThrow();
  });

  it.each(['Short1A', 'lowercasepassword1', 'UPPERCASEPASSWORD1', 'NoNumbersHere'])('rejects invalid password %s', (password) => {
    expect(() => assertPassword(password)).toThrow(BadRequestException);
  });

  it('accepts a reasonably long password', () => {
    expect(() => assertPassword(`A1${'password'.repeat(30)}`)).not.toThrow();
  });
});
