import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { config } from '../config.js';

const sql = postgres(config.DATABASE_URL, { max: 1, onnotice: () => {} });
const db = drizzle(sql);
console.log('Running migrations…');
await migrate(db, { migrationsFolder: 'src/db/migrations' });
console.log('Migrations complete.');
await sql.end();
