import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest(); const name = process.env.SESSION_COOKIE_NAME ?? 'qavio_ads_session'; const token = request.cookies?.[name];
    if (!token) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    const hash = createHash('sha256').update(token).digest('hex');
    const { rows } = await this.db.query<{id:string;user_id:string;email:string;platform_role:string;active_organization_id:string|null;mfa_enabled:boolean;status:string}>(
      `SELECT s.id,s.user_id,s.active_organization_id,u.email,u.platform_role,u.mfa_enabled,u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now()`, [hash]);
    if (!rows[0]) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn.');
    if (rows[0].status !== 'ACTIVE' || (rows[0].platform_role === 'SUPER_ADMIN' && !rows[0].mfa_enabled)) throw new UnauthorizedException('Phiên đăng nhập không đủ điều kiện truy cập.');
    request.user = { id: rows[0].user_id, email: rows[0].email, platformRole: rows[0].platform_role, sessionId: rows[0].id, activeOrganizationId: rows[0].active_organization_id };
    return true;
  }
}
