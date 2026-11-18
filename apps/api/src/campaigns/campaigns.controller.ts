import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/auth.decorator';
import { AuthenticatedUser } from '../common/authenticated-user';
import { SameOriginGuard } from '../common/same-origin.guard';
import { SessionGuard } from '../common/session.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CampaignsService, DraftInput } from './campaigns.service';
import { MarketingService } from './marketing.service';
import { ManualAdRequestInput, ManualRequestsService } from './manual-requests.service';

@Controller('v1/campaigns') @UseGuards(SessionGuard)
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService, private readonly marketing: MarketingService, private readonly manualRequests: ManualRequestsService) {}
  @Get('service-requests') listManualRequests(@CurrentUser() user: AuthenticatedUser) { return this.manualRequests.listForUser(user.id); }
  @Post('service-requests') @UseGuards(SameOriginGuard) createManualRequest(@CurrentUser() user: AuthenticatedUser, @Body() body: ManualAdRequestInput) { return this.manualRequests.create(user.id, body); }
  @Get('admin/service-requests') @UseGuards(RolesGuard) @Roles('SUPER_ADMIN') listManualRequestsForAdmin() { return this.manualRequests.listForAdmin(); }
  @Get('admin/meta-campaigns') @UseGuards(RolesGuard) @Roles('SUPER_ADMIN') listMetaCampaignsForAdmin() { return this.campaigns.listForAdmin(); }
  @Post('admin/meta-campaigns/:id/pause') @UseGuards(SameOriginGuard,RolesGuard) @Roles('SUPER_ADMIN') pauseMetaCampaignForAdmin(@CurrentUser() user:AuthenticatedUser,@Param('id') id:string) { return this.marketing.pause(user.id,id,'SUPER_ADMIN'); }
  @Patch('admin/service-requests/:id') @UseGuards(SameOriginGuard, RolesGuard) @Roles('SUPER_ADMIN') updateManualRequest(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: { status: string; adminNote?: string }) { return this.manualRequests.updateForAdmin(user.id, id, body.status, body.adminNote); }
  @Get() list(@CurrentUser() user: AuthenticatedUser) { return this.campaigns.list(user.id); }
  @Get('reports') reports(@CurrentUser() user:AuthenticatedUser,@Query('since') since?:string,@Query('until') until?:string) { return this.marketing.reports(user.id,since,until); }
  @Get('targeting/search') targetingSearch(@Query('type') type:string,@Query('q') query:string) { return this.marketing.searchTargeting(type,query); }
  @Get(':id') get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.campaigns.get(user.id, id); }
  @Post() @UseGuards(SameOriginGuard) create(@CurrentUser() user: AuthenticatedUser, @Body() body: DraftInput) { return this.campaigns.create(user.id, body); }
  @Patch(':id') @UseGuards(SameOriginGuard) update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: Partial<DraftInput>) { return this.campaigns.update(user.id, id, body); }
  @Delete(':id') @UseGuards(SameOriginGuard) remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.campaigns.remove(user.id, id); }
  @Post(':id/copy') @UseGuards(SameOriginGuard) copy(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.campaigns.copy(user.id, id); }
  @Post(':id/publish') @UseGuards(SameOriginGuard) publish(@CurrentUser() user: AuthenticatedUser, @Param('id') id:string,@Body() body:{confirmed?:boolean}) { return this.marketing.publishAndActivate(user.id,id,body.confirmed===true); }
  @Post(':id/pause') @UseGuards(SameOriginGuard) pause(@CurrentUser() user:AuthenticatedUser,@Param('id') id:string) { return this.marketing.pause(user.id,id); }
  @Post(':id/resume') @UseGuards(SameOriginGuard) resume(@CurrentUser() user:AuthenticatedUser,@Param('id') id:string,@Body() body:{confirmed?:boolean}) { return this.marketing.resume(user.id,id,body.confirmed===true); }
  @Post(':id/sync') @UseGuards(SameOriginGuard) sync(@CurrentUser() user: AuthenticatedUser, @Param('id') id:string) { return this.marketing.sync(user.id,id); }
  @Get(':id/insights') insights(@CurrentUser() user: AuthenticatedUser, @Param('id') id:string,@Query('since') since?:string,@Query('until') until?:string) { return this.marketing.insights(user.id,id,since,until); }
}
