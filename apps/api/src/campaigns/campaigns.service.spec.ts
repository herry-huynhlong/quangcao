import { BadRequestException, NotFoundException } from '@nestjs/common';
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
});
