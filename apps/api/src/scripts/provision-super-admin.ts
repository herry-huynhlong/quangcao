import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';

async function main() {
  const index = process.argv.indexOf('--email');
  const email = index >= 0 ? process.argv[index + 1] : undefined;
  if (!email) throw new Error('Usage: pnpm --filter @qavio/api admin:bootstrap -- --email owner@example.com');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try { console.log((await app.get(AuthService).createFirstAdminInvite(email)).message); }
  finally { await app.close(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
