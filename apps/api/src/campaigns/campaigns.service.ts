import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type DraftInput = { name: string; objective: string; assetId?: string; pageAssetId?: string; budgetType?: 'DAILY'|'LIFETIME'; dailyBudget?: number; lifetimeBudget?: number; startsAt?: string; endsAt?: string; configuration?: unknown; idempotencyKey?: string };
const objectives = new Set(['OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_SALES']);

@Injectable()
export class CampaignsService {
  constructor(private readonly db: DatabaseService) {}

  private validate(input: Partial<DraftInput>) {
    if (input.name !== undefined && !input.name.trim()) throw new BadRequestException('Tên chiến dịch không hợp lệ.');
    if (input.objective !== undefined && !objectives.has(input.objective)) throw new BadRequestException('Mục tiêu chiến dịch không hợp lệ.');
    if (input.dailyBudget !== undefined && (!Number.isSafeInteger(input.dailyBudget) || input.dailyBudget <= 0)) throw new BadRequestException('Ngân sách mỗi ngày phải là số VND nguyên lớn hơn 0.');
    if (input.lifetimeBudget !== undefined && (!Number.isSafeInteger(input.lifetimeBudget) || input.lifetimeBudget <= 0)) throw new BadRequestException('Ngân sách trọn đời phải là số VND nguyên lớn hơn 0.');
    if (input.budgetType !== undefined && !['DAILY','LIFETIME'].includes(input.budgetType)) throw new BadRequestException('Loại ngân sách không hợp lệ.');
    if ((input.budgetType ?? 'DAILY') === 'DAILY' && input.lifetimeBudget !== undefined) throw new BadRequestException('Chọn loại ngân sách trọn đời để nhập ngân sách trọn đời.');
    if (input.budgetType === 'LIFETIME' && input.dailyBudget !== undefined) throw new BadRequestException('Chọn loại ngân sách mỗi ngày để nhập ngân sách ngày.');
    if (input.startsAt && !Number.isFinite(new Date(input.startsAt).getTime())) throw new BadRequestException('Ngày bắt đầu không hợp lệ.');
    if (input.endsAt && !Number.isFinite(new Date(input.endsAt).getTime())) throw new BadRequestException('Ngày kết thúc không hợp lệ.');
    if (input.startsAt && input.endsAt && new Date(input.endsAt) <= new Date(input.startsAt)) throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu.');
  }

  private async pageAsset(userId: string, id?: string) {
    if (!id) return null;
    const result = await this.db.query(`SELECT id FROM meta_user_assets WHERE id=$1 AND qavio_user_id=$2 AND asset_type='PAGE' AND authorization_status='CONNECTED'`, [id, userId]);
    if (!result.rows[0]) throw new BadRequestException('Trang Facebook chưa được liên kết hợp lệ với tài khoản của bạn.');
    return id;
  }

  async list(userId: string) {
    return (await this.db.query(`SELECT c.id,c.name,c.objective,c.status,c.budget_type,c.daily_budget,c.lifetime_budget,c.currency,c.starts_at,c.ends_at,c.updated_at,p.asset_name page_name,p.external_asset_id page_id FROM campaign_drafts c LEFT JOIN meta_user_assets p ON p.id=c.page_asset_id WHERE c.user_id=$1 ORDER BY c.updated_at DESC`, [userId])).rows;
  }

  async listForAdmin() {
    return (await this.db.query(`SELECT c.id,c.user_id,u.email user_email,c.name,c.objective,c.status,c.meta_status,c.meta_effective_status,c.execution_ad_account_id,c.daily_budget,c.lifetime_budget,c.budget_type,c.currency,c.starts_at,c.ends_at,c.page_asset_id,p.asset_name page_name,p.external_asset_id page_id,c.meta_campaign_id,c.meta_adset_id,c.meta_creative_id,c.meta_ad_id,c.reserved_total_amount,c.fee_amount,c.meta_spend_amount,c.meta_insights,c.meta_insights_synced_at,c.last_error,c.last_synced_at,c.configuration,c.created_at,c.updated_at FROM campaign_drafts c JOIN users u ON u.id=c.user_id LEFT JOIN meta_user_assets p ON p.id=c.page_asset_id ORDER BY c.updated_at DESC LIMIT 200`)).rows;
  }

  async get(userId: string, id: string) {
    const result = await this.db.query(`SELECT * FROM campaign_drafts WHERE id=$1 AND user_id=$2`, [id, userId]);
    if (!result.rows[0]) throw new NotFoundException('Chiến dịch không tồn tại.');
    return result.rows[0];
  }

  async create(userId: string, input: DraftInput) {
    if (typeof input.name !== 'string' || !input.name.trim()) throw new BadRequestException('Nhập tên chiến dịch trước khi lưu.');
    if (typeof input.objective !== 'string' || !objectives.has(input.objective)) throw new BadRequestException('Chọn mục tiêu chiến dịch hợp lệ.');
    if (input.idempotencyKey !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.idempotencyKey)) throw new BadRequestException('Idempotency key không hợp lệ.');
    this.validate(input);
    const pageAssetId = await this.pageAsset(userId, input.pageAssetId);
    const result=await this.db.query(`INSERT INTO campaign_drafts(user_id,page_asset_id,name,objective,budget_type,daily_budget,lifetime_budget,starts_at,ends_at,configuration,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,COALESCE($11::uuid,gen_random_uuid())) ON CONFLICT(idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key WHERE campaign_drafts.user_id=EXCLUDED.user_id RETURNING *`, [userId, pageAssetId, input.name.trim(), input.objective, input.budgetType ?? 'DAILY', input.dailyBudget ?? null, input.lifetimeBudget ?? null, input.startsAt ?? null, input.endsAt ?? null, JSON.stringify(input.configuration ?? {}), input.idempotencyKey ?? null]);
    if(!result.rows[0])throw new ConflictException('Idempotency key này đã được sử dụng bởi tài khoản khác.');
    return result.rows[0];
  }

  async update(userId: string, id: string, input: Partial<DraftInput>) {
    this.validate(input);
    const existing = await this.get(userId, id);
    const startsAt = input.startsAt ?? existing.starts_at;
    const endsAt = input.endsAt ?? existing.ends_at;
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu.');
    const pageAssetId = input.pageAssetId === undefined ? undefined : await this.pageAsset(userId, input.pageAssetId);
    const result = await this.db.query(`UPDATE campaign_drafts SET name=COALESCE($1,name),objective=COALESCE($2,objective),page_asset_id=CASE WHEN $3 THEN $4::uuid ELSE page_asset_id END,budget_type=COALESCE($5,budget_type),daily_budget=CASE WHEN $5='LIFETIME' THEN NULL ELSE COALESCE($6,daily_budget) END,lifetime_budget=CASE WHEN $5='DAILY' THEN NULL ELSE COALESCE($7,lifetime_budget) END,starts_at=COALESCE($8,starts_at),ends_at=COALESCE($9,ends_at),configuration=COALESCE($10::jsonb,configuration),updated_at=now() WHERE id=$11 AND user_id=$12 AND status='DRAFT' RETURNING *`, [input.name?.trim() ?? null, input.objective ?? null, input.pageAssetId !== undefined, pageAssetId, input.budgetType ?? null, input.dailyBudget ?? null, input.lifetimeBudget ?? null, input.startsAt ?? null, input.endsAt ?? null, input.configuration === undefined ? null : JSON.stringify(input.configuration), id, userId]);
    if (!result.rows[0]) throw new BadRequestException('Chỉ có thể sửa bản nháp QAVIO.');
    return result.rows[0];
  }

  async remove(userId: string, id: string) {
    const result = await this.db.query(`DELETE FROM campaign_drafts WHERE id=$1 AND user_id=$2 AND status='DRAFT' RETURNING id`, [id, userId]);
    if (!result.rows[0]) throw new NotFoundException('Không tìm thấy bản nháp để xóa.');
    return { deleted: true };
  }

  async copy(userId: string, id: string) {
    const campaign = await this.get(userId, id);
    return this.create(userId, { name: `${campaign.name} (bản sao)`, objective: campaign.objective, pageAssetId: campaign.page_asset_id ?? undefined, budgetType: campaign.budget_type, dailyBudget: campaign.daily_budget ? Number(campaign.daily_budget) : undefined, lifetimeBudget: campaign.lifetime_budget ? Number(campaign.lifetime_budget) : undefined, startsAt: campaign.starts_at?.toISOString?.(), endsAt: campaign.ends_at?.toISOString?.(), configuration: campaign.configuration });
  }
}
