import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { FastifyReply } from 'fastify';
import { CurrentUser } from '../common/auth.decorator';
import { AuthenticatedUser } from '../common/authenticated-user';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { SameOriginGuard } from '../common/same-origin.guard';
import { SessionGuard } from '../common/session.guard';
import { MetaService } from './meta.service';

class AssignAccountDto { @IsString() organizationId!:string; }

@Controller('v1/meta')
export class MetaController {
  constructor(private readonly meta:MetaService) {}
  @Get('status') @UseGuards(SessionGuard,RolesGuard) @Roles('SUPER_ADMIN') status(@CurrentUser() user:AuthenticatedUser){ return this.meta.status(user.id); }
  @Get('oauth/start') @UseGuards(SessionGuard,RolesGuard) @Roles('SUPER_ADMIN') start(@CurrentUser() user:AuthenticatedUser){ return this.meta.start(user.id); }
  @Post('oauth/cancel') @UseGuards(SessionGuard,RolesGuard,SameOriginGuard) @Roles('SUPER_ADMIN') cancelOAuth(@CurrentUser() user:AuthenticatedUser){ return this.meta.cancelOAuth(user.id); }
  @Get('oauth/callback') callback(@Query('state') state:string|undefined,@Query('code') code:string|undefined,@Query('error') error:string|undefined,@Query('error_description') description:string|undefined,@Res() reply:FastifyReply){ return this.meta.callback(state,code,error,description).then(result=>reply.header('Cache-Control','no-store').code(302).redirect(result.redirect)); }
  @Post('check') @UseGuards(SessionGuard,RolesGuard,SameOriginGuard) @Roles('SUPER_ADMIN') check(@CurrentUser() user:AuthenticatedUser){ return this.meta.check(user.id); }
  @Post('sync') @UseGuards(SessionGuard,RolesGuard,SameOriginGuard) @Roles('SUPER_ADMIN') sync(@CurrentUser() user:AuthenticatedUser){ return this.meta.sync(user.id); }
  @Post('disconnect') @UseGuards(SessionGuard,RolesGuard,SameOriginGuard) @Roles('SUPER_ADMIN') disconnect(@CurrentUser() user:AuthenticatedUser){ return this.meta.disconnect(user.id); }
  @Post('ad-accounts/:id/assign') @UseGuards(SessionGuard,RolesGuard,SameOriginGuard) @Roles('SUPER_ADMIN') assign(@CurrentUser() user:AuthenticatedUser,@Param('id') accountId:string,@Body() body:AssignAccountDto){ return this.meta.assign(user.id,accountId,body.organizationId); }
}
