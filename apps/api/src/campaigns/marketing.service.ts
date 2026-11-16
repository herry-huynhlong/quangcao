import { BadRequestException, ConflictException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createDecipheriv } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { WalletService } from '../wallet/wallet.service';

type GraphError = { error?: { message?: string; code?: number } };
type CampaignRow = { id: string; user_id: string; name: string; objective: string; daily_budget: string | null; configuration: Record<string, unknown>; page_asset_id: string | null; meta_campaign_id: string | null; meta_adset_id: string | null; meta_creative_id: string | null; meta_ad_id: string | null; status: string };

@Injectable()
export class MarketingService {
  constructor(private readonly db: DatabaseService, private readonly wallet: WalletService) {}

  private decrypt(value: string) {
    const raw = process.env.APP_ENCRYPTION_KEY;
    if (!raw) throw new ServiceUnavailableException('APP_ENCRYPTION_KEY chưa được cấu hình.');
    const key = Buffer.from(raw, 'base64'); if (key.length !== 32) throw new ServiceUnavailableException('APP_ENCRYPTION_KEY không hợp lệ.');
    const [iv, tag, data] = value.split('.'); if (!iv || !tag || !data) throw new ServiceUnavailableException('Token Meta được lưu không hợp lệ.');
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url')); decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  }

  private async graph<T>(version: string, path: string, params: Record<string, string>, method = 'GET') {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const url = new URL(`https://graph.facebook.com/${version}/${path.replace(/^\//, '')}`);
      let body: URLSearchParams | undefined;
      if (method === 'GET') Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
      else body = new URLSearchParams(params);
      const response = await fetch(url, { method, body, signal: controller.signal });
      const data = await response.json().catch(() => ({})) as T & GraphError;
      if (!response.ok || data.error) throw new BadRequestException(this.message(data));
      return data as T;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if ((error as { name?: string }).name === 'AbortError') throw new ServiceUnavailableException('Meta API không phản hồi trong thời gian cho phép.');
      throw new ServiceUnavailableException('Không thể kết nối Meta API.');
    } finally { clearTimeout(timer); }
  }
  private message(body: GraphError) { if (body.error?.code === 190) return 'Token Meta không hợp lệ hoặc đã hết hạn.'; if ([10, 100, 200].includes(body.error?.code ?? 0)) return 'Meta từ chối quyền hoặc dữ liệu chiến dịch.'; return 'Meta từ chối thao tác quảng cáo.'; }

  private async context() {
    const result = await this.db.query<{ default_ad_account_id: string | null; system_user_token_encrypted: string | null; last_error: string | null; api_version: string | null }>(`SELECT p.default_ad_account_id,p.system_user_token_encrypted,p.last_error,i.api_version FROM meta_partner_config p LEFT JOIN provider_integrations i ON i.provider='META' WHERE p.id=true`);
    const value = result.rows[0];
    if (!value?.default_ad_account_id || !value.system_user_token_encrypted || value.last_error) throw new ConflictException('Meta Business Partner chưa sẵn sàng để tạo quảng cáo.');
    return { adAccountId: value.default_ad_account_id, token: this.decrypt(value.system_user_token_encrypted), version: value.api_version || 'v27.0' };
  }

  private async campaign(userId: string, id: string) {
    const result = await this.db.query<CampaignRow>(`SELECT * FROM campaign_drafts WHERE id=$1 AND user_id=$2`, [id, userId]);
    if (!result.rows[0]) throw new BadRequestException('Chiến dịch không thuộc tài khoản của bạn.');
    return result.rows[0];
  }
  private async page(userId: string, pageAssetId: string | null) {
    if (!pageAssetId) throw new ConflictException('Chọn Facebook Page đã được liên kết trước khi gửi Meta.');
    const result = await this.db.query<{ external_asset_id: string; granted_permissions: string[] }>(`SELECT external_asset_id,granted_permissions FROM meta_user_assets WHERE id=$1 AND qavio_user_id=$2 AND asset_type='PAGE' AND authorization_status='CONNECTED'`, [pageAssetId, userId]);
    if (!result.rows[0]) throw new ConflictException('Facebook Page chưa được xác minh cho tài khoản của bạn.');
    return result.rows[0];
  }
  private payload(campaign: CampaignRow, pageId: string) {
    const config = campaign.configuration ?? {}; const targeting = (config.targeting ?? {}) as Record<string, unknown>; const creative = (config.creative ?? config) as Record<string, unknown>;
    const ageMin = Number(targeting.ageMin ?? 18), ageMax = Number(targeting.ageMax ?? 65);
    if (!Number.isInteger(ageMin) || !Number.isInteger(ageMax) || ageMin < 18 || ageMax > 65 || ageMin > ageMax) throw new BadRequestException('Độ tuổi nhắm mục tiêu không hợp lệ.');
    const countries = Array.isArray(targeting.countries) ? targeting.countries.filter((value): value is string => typeof value === 'string' && /^[A-Z]{2}$/.test(value)) : [];
    if (!countries.length) throw new BadRequestException('Chọn ít nhất một quốc gia hợp lệ trước khi gửi Meta.');
    const destination = typeof creative.destination === 'string' ? creative.destination : '';
    const primaryText = typeof creative.primaryText === 'string' ? creative.primaryText : '';
    if (!destination.startsWith('https://') || !primaryText.trim()) throw new BadRequestException('Cần nội dung quảng cáo và liên kết đích HTTPS hợp lệ.');
    return { targeting: JSON.stringify({ geo_locations: { countries }, age_min: ageMin, age_max: ageMax, genders: targeting.gender === 'MALE' ? [1] : targeting.gender === 'FEMALE' ? [2] : undefined, publisher_platforms: Array.isArray(targeting.platforms) ? targeting.platforms : undefined }), creative: { object_story_spec: { page_id: pageId, link_data: { message: primaryText, link: destination, name: typeof creative.headline === 'string' ? creative.headline : undefined, description: typeof creative.description === 'string' ? creative.description : undefined, call_to_action: { type: typeof creative.cta === 'string' ? creative.cta : 'LEARN_MORE', value: { link: destination } } } } } };
  }

  async publishPaused(userId: string, id: string, confirmed: boolean) {
    if (!confirmed) throw new BadRequestException('Cần xác nhận rõ ràng trước khi gửi chiến dịch sang Meta ở trạng thái tạm dừng.');
    const campaign = await this.campaign(userId, id);
    if (campaign.meta_campaign_id) return { metaCampaignId: campaign.meta_campaign_id, alreadyPublished: true };
    if (!campaign.daily_budget) throw new BadRequestException('Cần ngân sách ngày trước khi gửi Meta.');
    const page = await this.page(userId, campaign.page_asset_id); const context = await this.context(); const data = this.payload(campaign, page.external_asset_id);
    await this.wallet.reserve(userId, campaign.id, Number(campaign.daily_budget));
    await this.db.query(`UPDATE campaign_drafts SET status='PUBLISHING',publish_idempotency_key=COALESCE(publish_idempotency_key,gen_random_uuid()),updated_at=now() WHERE id=$1 AND user_id=$2`, [id, userId]);
    try {
      const metaCampaign = await this.graph<{ id: string }>(context.version, `act_${context.adAccountId}/campaigns`, { name: campaign.name, objective: campaign.objective, status: 'PAUSED', special_ad_categories: '[]', access_token: context.token }, 'POST');
      await this.db.query(`UPDATE campaign_drafts SET meta_campaign_id=$1,updated_at=now() WHERE id=$2`, [metaCampaign.id, id]);
      const adSet = await this.graph<{ id: string }>(context.version, `act_${context.adAccountId}/adsets`, { name: `${campaign.name} · Ad Set`, campaign_id: metaCampaign.id, daily_budget: String(Math.round(Number(campaign.daily_budget) * 100)), billing_event: 'IMPRESSIONS', optimization_goal: 'LINK_CLICKS', targeting: data.targeting, status: 'PAUSED', access_token: context.token }, 'POST');
      await this.db.query(`UPDATE campaign_drafts SET meta_adset_id=$1,updated_at=now() WHERE id=$2`, [adSet.id, id]);
      const creative = await this.graph<{ id: string }>(context.version, `act_${context.adAccountId}/adcreatives`, { name: `${campaign.name} · Creative`, object_story_spec: JSON.stringify(data.creative.object_story_spec), access_token: context.token }, 'POST');
      await this.db.query(`UPDATE campaign_drafts SET meta_creative_id=$1,updated_at=now() WHERE id=$2`, [creative.id, id]);
      const ad = await this.graph<{ id: string }>(context.version, `act_${context.adAccountId}/ads`, { name: `${campaign.name} · Ad`, adset_id: adSet.id, creative: JSON.stringify({ creative_id: creative.id }), status: 'PAUSED', access_token: context.token }, 'POST');
      await this.db.query(`UPDATE campaign_drafts SET meta_ad_id=$1,meta_status='PAUSED',status='META_PAUSED',published_at=now(),last_error=NULL,updated_at=now() WHERE id=$2`, [ad.id, id]);
      await this.db.query(`INSERT INTO audit_logs(actor_type,actor_id,action,entity,entity_id,reason) VALUES('USER',$1,'META_CAMPAIGN_CREATED_PAUSED','campaign_draft',$2,'Meta objects created in PAUSED state')`, [userId, id]);
      return { metaCampaignId: metaCampaign.id, metaAdSetId: adSet.id, metaCreativeId: creative.id, metaAdId: ad.id, status: 'PAUSED' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo đối tượng Meta.';
      await this.db.query(`UPDATE campaign_drafts SET status='ERROR',meta_status='ERROR',last_error=$1,updated_at=now() WHERE id=$2`, [message, id]);
      await this.wallet.release(userId, id, 'META_PUBLISH_FAILED');
      throw error;
    }
  }

  async sync(userId: string, id: string) { const campaign = await this.campaign(userId, id); if (!campaign.meta_campaign_id) throw new ConflictException('Chiến dịch chưa tồn tại trên Meta.'); const context = await this.context(); const data = await this.graph<{ status?: string; effective_status?: string }>(context.version, campaign.meta_campaign_id, { fields: 'status,effective_status', access_token: context.token }); await this.db.query(`UPDATE campaign_drafts SET meta_status=$1,last_synced_at=now(),updated_at=now() WHERE id=$2`, [data.effective_status ?? data.status ?? null, id]); return data; }
  async insights(userId: string, id: string) { const campaign = await this.campaign(userId, id); if (!campaign.meta_campaign_id) return { data: [], unavailable: true }; const context = await this.context(); return this.graph(context.version, `${campaign.meta_campaign_id}/insights`, { fields: 'spend,impressions,reach,clicks,ctr,cpc,cpm,actions', access_token: context.token }); }
}
