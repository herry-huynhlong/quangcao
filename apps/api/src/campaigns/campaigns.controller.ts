import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth.decorator';
import { AuthenticatedUser } from '../common/authenticated-user';
import { SameOriginGuard } from '../common/same-origin.guard';
import { SessionGuard } from '../common/session.guard';
import { CampaignsService, DraftInput } from './campaigns.service';
import { MarketingService } from './marketing.service';

@Controller('v1/campaigns') @UseGuards(SessionGuard)
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService, private readonly marketing: MarketingService) {}
  @Get() list(@CurrentUser() user: AuthenticatedUser) { return this.campaigns.list(user.id); }
  @Get(':id') get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.campaigns.get(user.id, id); }
  @Post() @UseGuards(SameOriginGuard) create(@CurrentUser() user: AuthenticatedUser, @Body() body: DraftInput) { return this.campaigns.create(user.id, body); }
  @Patch(':id') @UseGuards(SameOriginGuard) update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: Partial<DraftInput>) { return this.campaigns.update(user.id, id, body); }
  @Delete(':id') @UseGuards(SameOriginGuard) remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.campaigns.remove(user.id, id); }
  @Post(':id/copy') @UseGuards(SameOriginGuard) copy(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.campaigns.copy(user.id, id); }
  @Post(':id/publish') @UseGuards(SameOriginGuard) publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id:string,@Body() body:{confirmed?:boolean}) { return this.marketing.publishPaused(user.id,id,body.confirmed===true); }
  @Post(':id/sync') @UseGuards(SameOriginGuard) sync(@CurrentUser() user: AuthenticatedUser, @Param('id') id:string) { return this.marketing.sync(user.id,id); }
  @Get(':id/insights') insights(@CurrentUser() user: AuthenticatedUser, @Param('id') id:string) { return this.marketing.insights(user.id,id); }
}
