import { BadRequestException } from '@nestjs/common';
import { ManualRequestsService } from './manual-requests.service';

const valid = { adAccountId:'2978487939176745', pageName:'QAVIO Page', objective:'OUTCOME_TRAFFIC', dailyBudget:200000, adText:'Nội dung quảng cáo' };

describe('ManualRequestsService', () => {
  it('accepts either an account ID or a name, but does not accept neither', async () => {
    const service = new ManualRequestsService({ query: jest.fn().mockResolvedValue({ rows:[{id:'request-id',status:'SUBMITTED'}] }) } as never);
    await expect(service.create('user-a', { ...valid, adAccountId:undefined })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('user-a', { ...valid, adAccountId:undefined, adAccountName:'Tài khoản QAVIO' })).resolves.toBeDefined();
  });

  it('rejects invalid budgets and date ranges', async () => {
    const service = new ManualRequestsService({ query: jest.fn() } as never);
    await expect(service.create('user-a', { ...valid, dailyBudget:0 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('user-a', { ...valid, startsAt:'2026-12-02T00:00:00Z', endsAt:'2026-12-01T00:00:00Z' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes customer request history to the authenticated user', async () => {
    const query = jest.fn().mockResolvedValue({ rows:[] });
    const service = new ManualRequestsService({ query } as never);
    await service.listForUser('user-a');
    expect(query.mock.calls[0][0]).toContain('WHERE user_id=$1');
    expect(query.mock.calls[0][1]).toEqual(['user-a']);
  });
});
