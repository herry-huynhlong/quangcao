import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';

describe('CampaignsService ownership and validation', () => {
  it('rejects invalid budgets before creating a draft', async () => {
    const db = { query: jest.fn() };
    const service = new CampaignsService(db as never);
    await expect(service.create('user-a', { name: 'Test', objective: 'OUTCOME_TRAFFIC', dailyBudget: 0 })).rejects.toBeInstanceOf(BadRequestException);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('does not accept a Page asset that is not connected to the requesting user', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = new CampaignsService(db as never);
    await expect(service.create('user-a', { name: 'Test', objective: 'OUTCOME_TRAFFIC', pageAssetId: 'page-owned-by-user-b' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not disclose a campaign belonging to another user', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = new CampaignsService(db as never);
    await expect(service.get('user-a', 'campaign-of-user-b')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects objectives and fractional VND budgets before making a database call', async () => {
    const db = { query: jest.fn() };
    const service = new CampaignsService(db as never);
    await expect(service.create('user-a', { name: 'Test', objective: 'NOT_A_META_OBJECTIVE' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('user-a', { name: 'Test', objective: 'OUTCOME_TRAFFIC', dailyBudget: 50000.5 })).rejects.toBeInstanceOf(BadRequestException);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('creates drafts with an idempotency key and returns the existing row on retry', async () => {
    const existing = { id: 'campaign-a', user_id: 'user-a', name: 'Draft' };
    const db = { query: jest.fn().mockResolvedValue({ rows: [existing] }) };
    const service = new CampaignsService(db as never);
    const input = { name: 'Draft', objective: 'OUTCOME_TRAFFIC', idempotencyKey: '4f30a052-ec1a-4667-a2a0-432df1f61135' };
    await expect(service.create('user-a', input)).resolves.toEqual(existing);
    await expect(service.create('user-a', input)).resolves.toEqual(existing);
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[0][0]).toContain('ON CONFLICT(idempotency_key)');
  });

  it('does not let a different user claim a reused idempotency key', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = new CampaignsService(db as never);
    await expect(service.create('user-b', { name: 'Draft', objective: 'OUTCOME_TRAFFIC', idempotencyKey: '4f30a052-ec1a-4667-a2a0-432df1f61135' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not allow a user to update or delete another user’s draft', async () => {
    const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = new CampaignsService(db as never);
    await expect(service.update('user-a', 'campaign-of-user-b', { name: 'Hijack' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove('user-a', 'campaign-of-user-b')).rejects.toBeInstanceOf(NotFoundException);
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it('rejects an invalid campaign schedule', async () => {
    const db = { query: jest.fn() };
    const service = new CampaignsService(db as never);
    await expect(service.create('user-a', { name: 'Draft', objective: 'OUTCOME_TRAFFIC', startsAt: '2026-11-18T10:00:00Z', endsAt: '2026-11-18T09:00:00Z' })).rejects.toBeInstanceOf(BadRequestException);
    expect(db.query).not.toHaveBeenCalled();
  });
});
