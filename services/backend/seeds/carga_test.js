/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
const bcrypt = require('bcrypt');

exports.seed = async function(knex) {

  const hashedPassword = await bcrypt.hash('password', 12);
  const hashedPasswordProd = await bcrypt.hash('password', 12);
  // VULNERABILIDAD: sembrar contraseñas en texto plano facilita ataques si se filtra la base inicial.
  // password: 'password',
  // MITIGACIÓN: almacenar únicamente hashes seguros.
  await knex('users').insert({
    id: 1,
    username: 'test',
    email: 'test@example.local',

    password: hashedPassword,
    first_name: 'Test',
    last_name: 'User',
    activated: true,
    reset_password_token: null,
    reset_password_expires: null,
    invite_token: null,
    invite_token_expires: null,
    picture_path: null
  });
  await knex('users').insert({
    id: 2,
    username: 'prod',
    email: 'prod@example.local',
    password: hashedPasswordProd,
    first_name: 'Prod',
    last_name: 'User',
    activated: true,
    reset_password_token: null,
    reset_password_expires: null,
    invite_token: null,
    invite_token_expires: null,
    picture_path: null
  });
  await knex('invoices').insert({
    id: 1,
    userId: 1,
    amount: 101.00,
    dueDate: new Date('2025-01-01'),
    status: 'unpaid'
   });
  await knex('invoices').insert({
    id: 2,
    userId: 1,
    amount: 102.00,
    dueDate: new Date('2025-01-01'),
    status: 'paid'
   });
  await knex('invoices').insert({
    id: 3,
    userId: 1,
    amount: 103.00,
    dueDate: new Date('2025-01-01'),
    status: 'paid'
   });
  await knex('invoices').insert({
    id: 4,
    userId: 2,
    amount: 99.00,
    dueDate: new Date('2025-01-01'),
    status: 'unpaid'
   });
};
