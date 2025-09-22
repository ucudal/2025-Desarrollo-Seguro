// knexfile.ts
/* import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASS || 'password',
      database: process.env.DB_NAME || 'jwt_api',
      port: parseInt(process.env.DB_PORT || '5432'),
    },
    migrations: {
      directory: '../migrations',
    },
    seeds: {
      directory: '../seeds',
    },
  },
};

export default config;

 */
import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: requireEnv('DB_HOST'),
      user: requireEnv('DB_USER'),
      password: requireEnv('DB_PASS'),
      database: requireEnv('DB_NAME'),
      port: parseInt(requireEnv('DB_PORT')),
    },
    migrations: {
      directory: '../migrations',
    },
    seeds: {
      directory: '../seeds',
    },
  },
};

export default config;
