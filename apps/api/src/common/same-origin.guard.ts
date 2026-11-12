import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
@Injectable()
export class SameOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const origin = context.switchToHttp().getRequest().headers.origin as string | undefined;
    const allowed = (process.env.WEB_ORIGIN ?? '').split(',').map((value) => value.trim()).filter(Boolean);
    if (origin && (!allowed.length || !allowed.includes(origin))) throw new ForbiddenException('Nguồn yêu cầu không được phép.');
    return true;
  }
}
