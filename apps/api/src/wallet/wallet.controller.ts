import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth.decorator';
import { AuthenticatedUser } from '../common/authenticated-user';
import { SessionGuard } from '../common/session.guard';
import { SameOriginGuard } from '../common/same-origin.guard';
import { WalletService } from './wallet.service';

@Controller('v1/wallet') @UseGuards(SessionGuard)
export class WalletController {
  constructor(private readonly wallets: WalletService) {}
  @Get() balance(@CurrentUser() user: AuthenticatedUser) { return this.wallets.balance(user.id); }
  @Post('campaign-quote') @UseGuards(SameOriginGuard) quote(@CurrentUser() user:AuthenticatedUser,@Body() body:{budgetType:'DAILY'|'LIFETIME';amount:number;days:number}) { return this.wallets.campaignQuote(user.id,body.budgetType,body.amount,body.days); }
}
