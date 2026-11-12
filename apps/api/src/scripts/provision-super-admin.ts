import 'reflect-metadata';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../auth/email.service';
import { DatabaseService } from '../database/database.service';

async function main() {
  const index = process.argv.indexOf('--email');
  const email = index >= 0 ? process.argv[index + 1] : undefined;
  if (!email) throw new Error('Usage: pnpm --filter @qavio/api admin:bootstrap -- --email owner@example.com');
  const db = new DatabaseService();
  try { console.log((await new AuthService(db, new EmailService()).createFirstAdminInvite(email)).message); }
  finally { await db.onModuleDestroy(); }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
