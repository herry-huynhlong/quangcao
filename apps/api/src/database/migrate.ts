import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const client = new Client({ connectionString: process.env.DATABASE_URL }); await client.connect();
  try { await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, executed_at timestamptz NOT NULL DEFAULT now())');
    const name = '001_identity_organizations.sql'; const exists = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
    if (!exists.rowCount) { await client.query('BEGIN'); await client.query(await readFile(resolve(process.cwd(), '../../migrations', name), 'utf8')); await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]); await client.query('COMMIT'); console.log(`Applied ${name}`); }
    else console.log(`${name} already applied`);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { await client.end(); }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
