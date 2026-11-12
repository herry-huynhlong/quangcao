import { Controller, Get } from '@nestjs/common';
@Controller()
export class OpenApiController {
  @Get('openapi.json')
  document() {
    return { openapi: '3.0.3', info: { title: 'QAVIO Ads API', version: '1.0.0-phase-01' }, servers: [{ url: '/api' }], paths: {
      '/v1/auth/register': { post: { summary: 'Register a QAVIO Ads user' } },
      '/v1/auth/login': { post: { summary: 'Create an opaque session' } },
      '/v1/auth/verify-email': { post: { summary: 'Verify email token' } },
      '/v1/auth/forgot-password': { post: { summary: 'Request password reset' } },
      '/v1/auth/reset-password': { post: { summary: 'Reset password and revoke sessions' } },
      '/v1/organizations': { get: { summary: 'List current user organizations' }, post: { summary: 'Create organization' } },
      '/health': { get: { summary: 'Liveness probe' } }, '/ready': { get: { summary: 'Readiness probe' } }
    }};
  }
}
