import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { MarketingService } from './marketing.service';

describe('MarketingService preflight validation', () => {
  const service = new MarketingService({} as never, {} as never);
  const campaign = (configuration: Record<string, unknown>, objective = 'OUTCOME_TRAFFIC') => ({
    id: 'campaign-a', user_id: 'user-a', name: 'Test', objective, budget_type: 'DAILY', daily_budget: '50000',
    lifetime_budget: null, currency: 'VND', configuration, page_asset_id: 'page-1', execution_ad_account_id: null,
    meta_campaign_id: null, meta_adset_id: null, meta_creative_id: null, meta_ad_id: null, status: 'DRAFT',
    starts_at: null, ends_at: null,
  });
  const validConfiguration: { targeting: { countries: unknown[]; ageMin: number; ageMax: number; platforms: string[] }; creative: Record<string, unknown> } = { targeting: { countries: ['VN'], ageMin: 18, ageMax: 65, platforms: ['facebook'] }, creative: { primaryText: 'A complete ad message', destination: 'https://example.com', mediaUrl: 'https://example.com/ad.jpg', cta: 'LEARN_MORE' } };

  it('rejects a Page post whose ID belongs to a different Page', () => {
    const input = structuredClone(validConfiguration);
    input.creative.existingPostId = 'page-2_123';
    delete input.creative.mediaUrl;
    expect(() => (service as never as { payload: (item: unknown, page: string, instagram: null) => unknown }).payload(campaign(input), 'page-1', null)).toThrow(BadRequestException);
  });

  it('rejects malformed targeting instead of silently dropping invalid values', () => {
    const input = structuredClone(validConfiguration);
    input.targeting.countries = ['VN', 'invalid'];
    expect(() => (service as never as { payload: (item: unknown, page: string, instagram: null) => unknown }).payload(campaign(input), 'page-1', null)).toThrow(BadRequestException);
  });

  it('does not claim that unsupported objectives can be published', () => {
    expect(() => (service as never as { payload: (item: unknown, page: string, instagram: null) => unknown }).payload(campaign(validConfiguration, 'OUTCOME_SALES'), 'page-1', null)).toThrow(ConflictException);
  });

  it('does not call unknown Meta effective statuses delivering', () => {
    expect((service as never as { mapEffectiveStatus: (status: string | undefined) => string }).mapEffectiveStatus(undefined)).toBe('META_PARTIAL');
    expect((service as never as { mapEffectiveStatus: (status: string | undefined) => string }).mapEffectiveStatus('ACTIVE')).toBe('META_DELIVERING');
  });

  it('does not disclose campaigns across users before any Meta request', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const isolated = new MarketingService(db as never, {} as never);
    await expect(isolated.publishAndActivate('user-a', 'campaign-of-user-b', true)).rejects.toBeInstanceOf(NotFoundException);
    expect(db.query).toHaveBeenCalledTimes(1);
  });
});
