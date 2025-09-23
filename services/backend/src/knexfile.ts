// knexfile.ts
import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      // VULNERABILIDAD: Weak Default Credentials
      // CWE-798: Use of Hard-coded Credentials
      // Las credenciales por defecto "user" y "password" son extremadamente débiles y predecibles.
      // Si las variables de entorno no están configuradas, la aplicación usará estas credenciales
      // inseguras que son fáciles de adivinar para un atacante.
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
