import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { FastifyReply } from 'fastify';
import { CurrentUser } from '../common/auth.decorator';
import { AuthenticatedUser } from '../common/authenticated-user';
import { SameOriginGuard } from '../common/same-origin.guard';
import { SessionGuard } from '../common/session.guard';
import { MetaService } from './meta.service';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
class PartnerRequestDto { @IsString() adAccountId!:string; @IsOptional() @IsString() pageId?:string; @IsOptional() @IsString() instagramAccountId?:string; }
class PartnerConfigDto { @IsString() businessPortfolioId!:string; @IsOptional() @IsString() systemUserToken?:string; }

@Controller('v1/meta')
export class MetaController {
  constructor(private readonly meta:MetaService) {}
  @Get('status') @UseGuards(SessionGuard) status(@CurrentUser() user:AuthenticatedUser){ return this.meta.status(user.id); }
  @Get('oauth/start') @UseGuards(SessionGuard) start(@CurrentUser() user:AuthenticatedUser){ return this.meta.start(user.id); }
  @Post('oauth/cancel') @UseGuards(SessionGuard,SameOriginGuard) cancelOAuth(@CurrentUser() user:AuthenticatedUser){ return this.meta.cancelOAuth(user.id); }
  @Get('oauth/callback') callback(@Query('state') state:string|undefined,@Query('code') code:string|undefined,@Query('error') error:string|undefined,@Query('error_description') description:string|undefined,@Res() reply:FastifyReply){ return this.meta.callback(state,code,error,description).then(result=>reply.header('Cache-Control','no-store').code(302).redirect(result.redirect)); }
  @Post('check') @UseGuards(SessionGuard,SameOriginGuard) check(@CurrentUser() user:AuthenticatedUser){ return this.meta.check(user.id); }
  @Post('sync') @UseGuards(SessionGuard,SameOriginGuard) sync(@CurrentUser() user:AuthenticatedUser){ return this.meta.sync(user.id); }
  @Post('disconnect') @UseGuards(SessionGuard,SameOriginGuard) disconnect(@CurrentUser() user:AuthenticatedUser){ return this.meta.disconnect(user.id); }
  @Post('ad-accounts/:id/select') @UseGuards(SessionGuard,SameOriginGuard) selectAccount(@CurrentUser() user:AuthenticatedUser,@Param('id') accountId:string){ return this.meta.selectAccount(user.id,accountId); }
  @Get('partner/config') @UseGuards(SessionGuard) partnerConfig(){return this.meta.partnerConfig();}
  @Get('partner/requests') @UseGuards(SessionGuard) partnerRequests(@CurrentUser() user:AuthenticatedUser){return this.meta.partnerRequests(user.id);}
  @Post('partner/requests') @UseGuards(SessionGuard,SameOriginGuard) requestPartner(@CurrentUser() user:AuthenticatedUser,@Body() body:PartnerRequestDto){return this.meta.createPartnerRequest(user.id,body);}
  @Post('partner/requests/:id/check') @UseGuards(SessionGuard,SameOriginGuard) checkPartner(@CurrentUser() user:AuthenticatedUser,@Param('id') id:string){return this.meta.recheckPartnerRequest(user.id,id);}
  @Get('partner/admin/requests') @UseGuards(SessionGuard,RolesGuard) @Roles('SUPER_ADMIN') adminPartnerRequests(){return this.meta.adminPartnerRequests();}
  @Post('partner/admin/configure') @UseGuards(SessionGuard,RolesGuard,SameOriginGuard) @Roles('SUPER_ADMIN') configurePartner(@CurrentUser() user:AuthenticatedUser,@Body() body:PartnerConfigDto){return this.meta.configurePartner(user.id,body);}
  @Post('partner/admin/requests/:id/verify') @UseGuards(SessionGuard,RolesGuard,SameOriginGuard) @Roles('SUPER_ADMIN') verifyPartner(@Param('id') id:string){return this.meta.verifyPartnerRequest(id);}
  @Post('partner/admin/requests/:id/approve') @UseGuards(SessionGuard,RolesGuard,SameOriginGuard) @Roles('SUPER_ADMIN') approvePartner(@CurrentUser() user:AuthenticatedUser,@Param('id') id:string){return this.meta.approvePartnerRequest(user.id,id);}
}
