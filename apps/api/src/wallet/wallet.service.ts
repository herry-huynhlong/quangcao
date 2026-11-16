import { ConflictException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class WalletService {
  constructor(private readonly db: DatabaseService) {}

  async balance(userId: string) {
    const result = await this.db.query(`INSERT INTO wallet_accounts(user_id) VALUES($1) ON CONFLICT(user_id) DO UPDATE SET updated_at=wallet_accounts.updated_at RETURNING id,currency,available_amount,reserved_amount`, [userId]);
    return result.rows[0];
  }

  async reserve(userId: string, campaignId: string, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) throw new ConflictException('Ngân sách cần giữ không hợp lệ.');
    return this.db.transaction(async client => {
      const account = await client.query<{ id: string; available_amount: string; reserved_amount: string; currency: string }>(`INSERT INTO wallet_accounts(user_id) VALUES($1) ON CONFLICT(user_id) DO UPDATE SET updated_at=wallet_accounts.updated_at RETURNING id,available_amount,reserved_amount,currency`, [userId]);
      const locked = await client.query<{ id: string; available_amount: string; reserved_amount: string; currency: string }>(`SELECT id,available_amount,reserved_amount,currency FROM wallet_accounts WHERE id=$1 FOR UPDATE`, [account.rows[0].id]);
      const wallet = locked.rows[0];
      const existing = await client.query(`SELECT id,status FROM campaign_budget_reservations WHERE campaign_draft_id=$1 FOR UPDATE`, [campaignId]);
      if (existing.rows[0]?.status === 'HELD') return { reservationId: existing.rows[0].id, alreadyHeld: true };
      if (Number(wallet.available_amount) < amount) throw new ConflictException('Số dư khả dụng không đủ để giữ ngân sách chiến dịch.');
      await client.query(`UPDATE wallet_accounts SET available_amount=available_amount-$1,reserved_amount=reserved_amount+$1,updated_at=now() WHERE id=$2`, [amount, wallet.id]);
      const reservation = await client.query<{ id: string }>(`INSERT INTO campaign_budget_reservations(campaign_draft_id,wallet_account_id,amount) VALUES($1,$2,$3) ON CONFLICT(campaign_draft_id) DO UPDATE SET amount=EXCLUDED.amount,status='HELD',released_at=NULL RETURNING id`, [campaignId, wallet.id, amount]);
      await client.query(`INSERT INTO wallet_transactions(wallet_account_id,kind,amount,currency,reference_type,reference_id,metadata) VALUES($1,'RESERVATION',$2,$3,'campaign_draft',$4,$5::jsonb)`, [wallet.id, -amount, wallet.currency, campaignId, JSON.stringify({})]);
      return { reservationId: reservation.rows[0].id, alreadyHeld: false };
    });
  }

  async release(userId: string, campaignId: string, reason: string) {
    return this.db.transaction(async client => {
      const reservation = await client.query<{ id: string; wallet_account_id: string; amount: string; status: string }>(`SELECT r.id,r.wallet_account_id,r.amount,r.status FROM campaign_budget_reservations r JOIN wallet_accounts w ON w.id=r.wallet_account_id WHERE r.campaign_draft_id=$1 AND w.user_id=$2 FOR UPDATE`, [campaignId, userId]);
      const item = reservation.rows[0];
      if (!item || item.status !== 'HELD') return { released: false };
      await client.query(`UPDATE wallet_accounts SET available_amount=available_amount+$1,reserved_amount=reserved_amount-$1,updated_at=now() WHERE id=$2`, [item.amount, item.wallet_account_id]);
      await client.query(`UPDATE campaign_budget_reservations SET status='RELEASED',released_at=now() WHERE id=$1`, [item.id]);
      await client.query(`INSERT INTO wallet_transactions(wallet_account_id,kind,amount,reference_type,reference_id,metadata) VALUES($1,'RESERVATION_RELEASE',$2,'campaign_draft',$3,$4::jsonb)`, [item.wallet_account_id, item.amount, campaignId, JSON.stringify({ reason })]);
      return { released: true };
    });
  }
}
