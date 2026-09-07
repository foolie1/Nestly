/** DEV ONLY — drops and recreates the public schema. */
import postgres from 'postgres';
import { config } from '../config.js';

if (config.NODE_ENV === 'production') {
  console.error('Refusing to reset a production database.');
  process.exit(1);
}
const sql = postgres(config.DATABASE_URL, { max: 1, onnotice: () => {} });
await sql.unsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
console.log('Schema reset.');
await sql.end();
