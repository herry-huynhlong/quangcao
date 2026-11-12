import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { AdminService } from './admin.service';
import { SessionGuard } from '../common/session.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { SameOriginGuard } from '../common/same-origin.guard';
import { CurrentUser } from '../common/auth.decorator';
import { AuthenticatedUser } from '../common/authenticated-user';
class PlatformFeeDto { @IsNumber() @Min(5) @Max(50) percentage!: number; @IsOptional() @IsString() scopeType?: string; @IsOptional() @IsString() scopeKey?: string; }
class ProviderConfigDto { @IsString() provider!: string; @IsOptional() @IsString() clientId?: string; @IsOptional() @IsString() clientSecret?: string; @IsOptional() @IsString() apiVersion?: string; }
class PageQuery { @IsOptional() @IsString() search?: string; @IsOptional() @IsString() status?: string; @IsOptional() @IsString() action?: string; @IsOptional() @IsString() page?: string; @IsOptional() @IsString() limit?: string; }
@Controller('v1/admin') @UseGuards(SessionGuard, RolesGuard) @Roles('SUPER_ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('overview') overview(){ return this.admin.overview(); }
  @Get('users') users(@Query() q:PageQuery){ return this.admin.users(q); }
  @Get('users/:id') user(@Param('id') id:string){ return this.admin.user(id); }
  @Post('users/:id/suspend') @UseGuards(SameOriginGuard) suspend(@CurrentUser() u:AuthenticatedUser,@Param('id') id:string){ return this.admin.setUserStatus(u.id,id,'SUSPENDED'); }
  @Post('users/:id/activate') @UseGuards(SameOriginGuard) activate(@CurrentUser() u:AuthenticatedUser,@Param('id') id:string){ return this.admin.setUserStatus(u.id,id,'ACTIVE'); }
  @Get('organizations') organizations(@Query() q:PageQuery){ return this.admin.organizations(q); }
  @Get('organizations/:id') organization(@Param('id') id:string){ return this.admin.organization(id); }
  @Get('audit') audit(@Query() q:PageQuery){ return this.admin.audit(q); }
  @Get('sessions') sessions(@Query() q:PageQuery){ return this.admin.sessions(q); }
  @Post('sessions/:id/revoke') @UseGuards(SameOriginGuard) revoke(@CurrentUser() u:AuthenticatedUser,@Param('id') id:string){ return this.admin.revokeSession(u.id,u.sessionId,id); }
  @Get('security') security(){ return this.admin.security(); }
  @Get('integrations') integrations(){ return this.admin.integrations(); }
  @Get('integrations/:provider') integration(@Param('provider') provider:string){ return this.admin.integration(provider); }
  @Post('integrations/configure') @UseGuards(SameOriginGuard) configureIntegration(@CurrentUser() u:AuthenticatedUser,@Body() b:ProviderConfigDto){ return this.admin.configureIntegration(u.id,b); }
  @Get('fees') fees(){ return this.admin.fees(); }
  @Post('fees/platform') @UseGuards(SameOriginGuard) fee(@CurrentUser() u:AuthenticatedUser,@Body() b:PlatformFeeDto){ return this.admin.setFeePolicy(u.id,b.percentage,b.scopeType,b.scopeKey); }
}
