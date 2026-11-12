import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}
  async overview() {
    const [users, organizations, logs] = await Promise.all([
      this.db.query<{count:string}>('SELECT count(*) FROM users'),
      this.db.query<{count:string}>('SELECT count(*) FROM organizations'),
      this.db.query('SELECT action,entity,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10'),
    ]);
    return { users: Number(users.rows[0].count), organizations: Number(organizations.rows[0].count), database: 'healthy', integrations: { resend: process.env.EMAIL_PROVIDER === 'resend' && Boolean(process.env.RESEND_API_KEY) ? 'configured' : 'not_configured', meta: 'not_configured', google: 'not_configured', tiktok: 'not_configured', payments: 'not_configured' }, recentAudit: logs.rows };
  }
  async users(search = '') { return (await this.db.query(`SELECT id,email,email_verified_at,status,platform_role,created_at FROM users WHERE email ILIKE $1 ORDER BY created_at DESC LIMIT 100`, [`%${search}%`])).rows; }
  async organizations() { return (await this.db.query(`SELECT o.id,o.name,o.status,o.created_at,count(m.id)::int AS member_count FROM organizations o LEFT JOIN memberships m ON m.organization_id=o.id AND m.status='ACTIVE' GROUP BY o.id ORDER BY o.created_at DESC LIMIT 100`)).rows; }
  async organization(id: string) { const org = await this.db.query(`SELECT id,name,legal_name,status,created_at FROM organizations WHERE id=$1`, [id]); if (!org.rows[0]) throw new NotFoundException('Tổ chức không tồn tại.'); const members = await this.db.query(`SELECT u.id,u.email,m.role,m.status FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1`, [id]); return { ...org.rows[0], members: members.rows }; }
  async setUserStatus(actorId: string, userId: string, status: 'ACTIVE' | 'SUSPENDED') { if (actorId === userId) throw new NotFoundException('Không thể tự khóa tài khoản quản trị đang dùng.'); const updated = await this.db.query<{id:string}>(`UPDATE users SET status=$1,updated_at=now() WHERE id=$2 AND platform_role <> 'SUPER_ADMIN' RETURNING id`, [status, userId]); if (!updated.rows[0]) throw new NotFoundException('Không tìm thấy người dùng hoặc thao tác không được phép.'); if (status === 'SUSPENDED') await this.db.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [userId]); await this.db.query(`INSERT INTO audit_logs(actor_type,actor_id,action,entity,entity_id,reason) VALUES('USER',$1,$2,'user',$3,'Admin status change')`, [actorId, `USER_${status}`, userId]); return { id: userId, status }; }
  async audit() { return (await this.db.query(`SELECT created_at,actor_type,action,entity,entity_id,reason,ip FROM audit_logs ORDER BY created_at DESC LIMIT 200`)).rows; }
}
