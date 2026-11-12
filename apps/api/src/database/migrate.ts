import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const client = new Client({ connectionString: process.env.DATABASE_URL }); await client.connect();
  try { await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, executed_at timestamptz NOT NULL DEFAULT now())');
    const directory = resolve(process.cwd(), '../../migrations');
    const names = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
    for (const name of names) {
      const exists = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
      if (exists.rowCount) { console.log(`${name} already applied`); continue; }
      await client.query('BEGIN');
      try { await client.query(await readFile(resolve(directory, name), 'utf8')); await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]); await client.query('COMMIT'); console.log(`Applied ${name}`); }
      catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { await client.end(); }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
