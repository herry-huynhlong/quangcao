import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type DraftInput = { name: string; objective: string; assetId?: string; pageAssetId?: string; dailyBudget?: number; startsAt?: string; endsAt?: string; configuration?: unknown; idempotencyKey?: string };
const objectives = new Set(['OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_SALES']);

@Injectable()
export class CampaignsService {
  constructor(private readonly db: DatabaseService) {}

  private validate(input: Partial<DraftInput>) {
    if (input.name !== undefined && !input.name.trim()) throw new BadRequestException('Tên chiến dịch không hợp lệ.');
    if (input.objective !== undefined && !objectives.has(input.objective)) throw new BadRequestException('Mục tiêu chiến dịch không hợp lệ.');
    if (input.dailyBudget !== undefined && (!Number.isFinite(input.dailyBudget) || input.dailyBudget <= 0)) throw new BadRequestException('Ngân sách phải lớn hơn 0.');
    if (input.startsAt && input.endsAt && new Date(input.endsAt) <= new Date(input.startsAt)) throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu.');
  }

  private async pageAsset(userId: string, id?: string) {
    if (!id) return null;
    const result = await this.db.query(`SELECT id FROM meta_user_assets WHERE id=$1 AND qavio_user_id=$2 AND asset_type='PAGE' AND authorization_status='CONNECTED'`, [id, userId]);
    if (!result.rows[0]) throw new BadRequestException('Trang Facebook chưa được liên kết hợp lệ với tài khoản của bạn.');
    return id;
  }

  async list(userId: string) {
    return (await this.db.query(`SELECT c.id,c.name,c.objective,c.status,c.daily_budget,c.currency,c.starts_at,c.ends_at,c.updated_at,p.asset_name page_name,p.external_asset_id page_id FROM campaign_drafts c LEFT JOIN meta_user_assets p ON p.id=c.page_asset_id WHERE c.user_id=$1 ORDER BY c.updated_at DESC`, [userId])).rows;
  }

  async get(userId: string, id: string) {
    const result = await this.db.query(`SELECT * FROM campaign_drafts WHERE id=$1 AND user_id=$2`, [id, userId]);
    if (!result.rows[0]) throw new NotFoundException('Chiến dịch không tồn tại.');
    return result.rows[0];
  }

  async create(userId: string, input: DraftInput) {
    this.validate(input);
    const pageAssetId = await this.pageAsset(userId, input.pageAssetId);
    if (input.idempotencyKey) {
      const existing = await this.db.query(`SELECT * FROM campaign_drafts WHERE user_id=$1 AND idempotency_key=$2`, [userId, input.idempotencyKey]);
      if (existing.rows[0]) return existing.rows[0];
    }
    return (await this.db.query(`INSERT INTO campaign_drafts(user_id,page_asset_id,name,objective,daily_budget,starts_at,ends_at,configuration,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,COALESCE($9::uuid,gen_random_uuid())) RETURNING *`, [userId, pageAssetId, input.name.trim(), input.objective, input.dailyBudget ?? null, input.startsAt ?? null, input.endsAt ?? null, JSON.stringify(input.configuration ?? {}), input.idempotencyKey ?? null])).rows[0];
  }

  async update(userId: string, id: string, input: Partial<DraftInput>) {
    this.validate(input);
    const existing = await this.get(userId, id);
    const startsAt = input.startsAt ?? existing.starts_at;
    const endsAt = input.endsAt ?? existing.ends_at;
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu.');
    const pageAssetId = input.pageAssetId === undefined ? undefined : await this.pageAsset(userId, input.pageAssetId);
    const result = await this.db.query(`UPDATE campaign_drafts SET name=COALESCE($1,name),objective=COALESCE($2,objective),page_asset_id=CASE WHEN $3 THEN $4::uuid ELSE page_asset_id END,daily_budget=COALESCE($5,daily_budget),starts_at=COALESCE($6,starts_at),ends_at=COALESCE($7,ends_at),configuration=COALESCE($8::jsonb,configuration),updated_at=now() WHERE id=$9 AND user_id=$10 AND status='DRAFT' RETURNING *`, [input.name?.trim() ?? null, input.objective ?? null, input.pageAssetId !== undefined, pageAssetId, input.dailyBudget ?? null, input.startsAt ?? null, input.endsAt ?? null, input.configuration === undefined ? null : JSON.stringify(input.configuration), id, userId]);
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
    return this.create(userId, { name: `${campaign.name} (bản sao)`, objective: campaign.objective, pageAssetId: campaign.page_asset_id ?? undefined, dailyBudget: campaign.daily_budget ? Number(campaign.daily_budget) : undefined, startsAt: campaign.starts_at?.toISOString?.(), endsAt: campaign.ends_at?.toISOString?.(), configuration: campaign.configuration });
  }
}
