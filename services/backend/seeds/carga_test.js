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
  const usersIds = await knex('users').insert([
    {
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
    },
    {
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
    }
  ]).returning('id');
  
  await knex('invoices').insert([
    {
    userId: usersIds[0].id,
    amount: 101.00,
    dueDate: new Date('2025-01-01'),
    status: 'unpaid'
   },{
    userId: usersIds[0].id,
    amount: 102.00,
    dueDate: new Date('2025-01-01'),
    status: 'paid'
   },{
    userId: usersIds[0].id,
    amount: 103.00,
    dueDate: new Date('2025-01-01'),
    status: 'paid'
   },{
    userId: usersIds[1].id,
    amount: 99.00,
    dueDate: new Date('2025-01-01'),
    status: 'unpaid'
   }]);
};
