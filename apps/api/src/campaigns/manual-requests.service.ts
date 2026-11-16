import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type ManualAdRequestInput = {
  adAccountId?: string; adAccountName?: string; pageName: string; objective: string;
  dailyBudget: number; currency?: string; startsAt?: string; endsAt?: string;
  adText: string; destinationUrl?: string; mediaUrl?: string; customerNote?: string;
};
const objectives = new Set(['OUTCOME_AWARENESS','OUTCOME_TRAFFIC','OUTCOME_ENGAGEMENT','OUTCOME_LEADS','OUTCOME_SALES']);
const statuses = new Set(['SUBMITTED','ACCESS_PENDING','READY','IN_PROGRESS','NEEDS_INFO','COMPLETED','REJECTED']);

@Injectable()
export class ManualRequestsService {
  constructor(private readonly db: DatabaseService) {}

  private validate(input: ManualAdRequestInput) {
    const account = input.adAccountId?.trim().replace(/^act_/, '') || null;
    if (account && !/^\d{3,}$/.test(account)) throw new BadRequestException('ID tài khoản quảng cáo không hợp lệ.');
    if (!account && !input.adAccountName?.trim()) throw new BadRequestException('Nhập ID hoặc tên tài khoản quảng cáo để QAVIO xác định.');
    if (input.adAccountName && input.adAccountName.trim().length > 255) throw new BadRequestException('Tên tài khoản quảng cáo quá dài.');
    if (!input.pageName?.trim()) throw new BadRequestException('Nhập tên Trang Facebook.');
    if (!objectives.has(input.objective)) throw new BadRequestException('Chọn mục tiêu quảng cáo hợp lệ.');
    if (!Number.isFinite(input.dailyBudget) || input.dailyBudget <= 0) throw new BadRequestException('Ngân sách mỗi ngày phải lớn hơn 0.');
    if (!input.adText?.trim()) throw new BadRequestException('Nhập nội dung quảng cáo.');
    if (input.adText.length > 10000 || (input.customerNote?.length ?? 0) > 4000) throw new BadRequestException('Nội dung vượt quá giới hạn cho phép.');
    if (input.startsAt && Number.isNaN(Date.parse(input.startsAt))) throw new BadRequestException('Ngày bắt đầu không hợp lệ.');
    if (input.endsAt && Number.isNaN(Date.parse(input.endsAt))) throw new BadRequestException('Ngày kết thúc không hợp lệ.');
    if (input.startsAt && input.endsAt && Date.parse(input.endsAt) <= Date.parse(input.startsAt)) throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu.');
    if (input.destinationUrl && !/^https?:\/\//i.test(input.destinationUrl)) throw new BadRequestException('Liên kết đích phải bắt đầu bằng http:// hoặc https://.');
    if (input.mediaUrl && !/^https?:\/\//i.test(input.mediaUrl)) throw new BadRequestException('Liên kết ảnh/video phải bắt đầu bằng http:// hoặc https://.');
    return account;
  }

  async listForUser(userId: string) {
    return (await this.db.query(`SELECT id,ad_account_id,ad_account_name,page_name,objective,daily_budget,currency,starts_at,ends_at,ad_text,destination_url,media_url,customer_note,status,admin_note,created_at,updated_at FROM manual_ad_service_requests WHERE user_id=$1 ORDER BY created_at DESC`, [userId])).rows;
  }

  async create(userId: string, input: ManualAdRequestInput) {
    const account = this.validate(input);
    const result = await this.db.query(`INSERT INTO manual_ad_service_requests(user_id,ad_account_id,ad_account_name,page_name,objective,daily_budget,currency,starts_at,ends_at,ad_text,destination_url,media_url,customer_note) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id,status,created_at`, [userId,account,input.adAccountName?.trim() || null,input.pageName.trim(),input.objective,input.dailyBudget,(input.currency ?? 'VND').trim().toUpperCase(),input.startsAt ?? null,input.endsAt ?? null,input.adText.trim(),input.destinationUrl?.trim() || null,input.mediaUrl?.trim() || null,input.customerNote?.trim() || null]);
    await this.db.query(`INSERT INTO audit_logs(actor_type,actor_id,action,entity,entity_id) VALUES('USER',$1,'MANUAL_AD_REQUEST_SUBMITTED','manual_ad_service_request',$2)`, [userId,result.rows[0].id]);
    return result.rows[0];
  }

  async listForAdmin() {
    return (await this.db.query(`SELECT r.*,u.email AS user_email FROM manual_ad_service_requests r JOIN users u ON u.id=r.user_id ORDER BY CASE WHEN r.status IN ('SUBMITTED','ACCESS_PENDING','READY','NEEDS_INFO') THEN 0 ELSE 1 END,r.created_at DESC`)).rows;
  }

  async updateForAdmin(actorId: string, id: string, status: string, adminNote?: string) {
    if (!statuses.has(status)) throw new BadRequestException('Trạng thái xử lý không hợp lệ.');
    if (adminNote && adminNote.length > 2000) throw new BadRequestException('Ghi chú quá dài.');
    const result = await this.db.query(`UPDATE manual_ad_service_requests SET status=$1,admin_note=$2,reviewed_by_user_id=$3,reviewed_at=now(),updated_at=now() WHERE id=$4 RETURNING id,user_id,status,admin_note`, [status,adminNote?.trim() || null,actorId,id]);
    if (!result.rows[0]) throw new NotFoundException('Không tìm thấy yêu cầu quảng cáo.');
    await this.db.query(`INSERT INTO audit_logs(actor_type,actor_id,action,entity,entity_id,reason) VALUES('USER',$1,'MANUAL_AD_REQUEST_UPDATED','manual_ad_service_request',$2,$3)`, [actorId,id,status]);
    return result.rows[0];
  }
}
