import hashUtils from '../src/utils/hash';
import db from '../src/db';
import { UserRow } from '../src/types/user';

// Permite simular la migración.
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-n');

// Detecta prefijos del algoritmo ($2a$ o $2b$).
function looksLikeBcryptHash(string: string | null | undefined): boolean {
  if (!string) return false;
  return /^\$2[ab]\$[0-9]{2}\$/.test(string);
}

async function main() {
  console.log('*** INICIO DEL SCRIPT DE MIGRACIÓN DE HASH ***');
  console.log(`DRY RUN: ${DRY_RUN ? 'SÍ' : 'NO'}`);
  try {
    // Usuarios que sus datos sensibles no están hasheados.
    const users = await db<UserRow>('users')
    .select('id', 'username', 'email', 'password', 'invite_token', 'reset_password_token');

    console.log(`Hay ${users.length} usuarios.`);

    let updated_count = 0;
    for (const user of users) {
      const needs_password_hash = !looksLikeBcryptHash(user.password);
      const needs_invite_token_hash = !looksLikeBcryptHash(user.invite_token);
      const needs_reset_password_token_hash = !looksLikeBcryptHash(user.reset_password_token)

      console.log(`\nUsuario 
        id=${user.id} 
        username=${user.username} 
        email=${user.email}`);
      console.log(` - tiene password?: ${user.password ? 'sí' : 'no'}  
        necesita hash?: ${needs_password_hash}`);
      console.log(` - tiene invite_token?: ${user.invite_token ? 'sí' : 'no'}  
        necesita hash?: ${needs_invite_token_hash}`);
      console.log(` - tiene reset_password_token?: ${user.reset_password_token ? 'sí' : 'no'}  
        necesita hash?: ${needs_reset_password_token_hash}`);

      if (!needs_password_hash
        && !needs_invite_token_hash
        && !needs_reset_password_token_hash ) {
        console.log(' - nada que hacer sobre este usuario.');
        continue;
      }

      if (DRY_RUN) {
        console.log(' - DRY RUN: no se harán cambios en la base de datos.');
        continue;
      }

      // Realiza una actualización en el usuario con datos sensibles sin hashear.
      await db.transaction(async (trx) => {
        const updates: Partial<UserRow> = {};
        if (needs_password_hash && user.password) {
          const hashed_password = await hashUtils.hashPlainText(user.password)
          updates.password = hashed_password;
        }
        if (needs_invite_token_hash && user.invite_token) {
          const hashed_token = await hashUtils.hashPlainText(user.invite_token)
          updates.invite_token = hashed_token;
        }
        if (needs_reset_password_token_hash && user.reset_password_token) {
          const hashed_token = await hashUtils.hashPlainText(user.reset_password_token)
          updates.reset_password_token = hashed_token;
        }
        if (Object.keys(updates).length > 0) {
          await trx<UserRow>('users').where({ id: user.id }).update(updates);
          updated_count++;
          console.log(' - actualizado en la BD.');
        } else {
          console.log(' - no se requiere actualizaciones en la transacción.');
        }
      });
    }

    console.log(`\nCompletado. Total de filas (usuarios) actualizadas: ${updated_count}`);
  } catch (err) {
    console.error('ERROR durante la migración:', err);
  } finally {
    await db.destroy();
    console.log('*** FIN DEL SCRIPT DE MIGRACIÓN DE HASH ***');
  }
}

main();