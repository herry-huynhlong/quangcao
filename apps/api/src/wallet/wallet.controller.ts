import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth.decorator';
import { AuthenticatedUser } from '../common/authenticated-user';
import { SessionGuard } from '../common/session.guard';
import { WalletService } from './wallet.service';

@Controller('v1/wallet') @UseGuards(SessionGuard)
export class WalletController {
  constructor(private readonly wallets: WalletService) {}
  @Get() balance(@CurrentUser() user: AuthenticatedUser) { return this.wallets.balance(user.id); }
}
