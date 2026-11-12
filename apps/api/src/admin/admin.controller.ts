import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SessionGuard } from '../common/session.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { SameOriginGuard } from '../common/same-origin.guard';
import { CurrentUser } from '../common/auth.decorator';
import { AuthenticatedUser } from '../common/authenticated-user';

@Controller('v1/admin')
@UseGuards(SessionGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('overview') overview() { return this.admin.overview(); }
  @Get('users') users(@Query('search') search?: string) { return this.admin.users(search ?? ''); }
  @Post('users/:id/suspend') @UseGuards(SameOriginGuard) suspend(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.admin.setUserStatus(user.id, id, 'SUSPENDED'); }
  @Post('users/:id/activate') @UseGuards(SameOriginGuard) activate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.admin.setUserStatus(user.id, id, 'ACTIVE'); }
  @Get('organizations') organizations() { return this.admin.organizations(); }
  @Get('organizations/:id') organization(@Param('id') id: string) { return this.admin.organization(id); }
  @Get('audit') audit() { return this.admin.audit(); }
}
