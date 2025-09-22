import knex from 'knex';
import config from '../src/knexfile';

async function testConnection() {
  try {
    const db = knex(config.development); // usa la configuración hard-coded
    const result = await db.raw('SELECT 1+1 AS result');
    console.log('Conexión exitosa, prueba SQL:', result.rows);
    await db.destroy();
  } catch (err) {
    console.error('Error de conexión:', err);
  }
}

testConnection();
