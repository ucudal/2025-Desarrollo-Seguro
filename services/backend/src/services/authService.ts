
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import db from '../db';
import { User,UserRow } from '../types/user';
import jwtUtils from '../utils/jwt';
import ejs from 'ejs';

const RESET_TTL = 1000 * 60 * 60;         // 1h
const INVITE_TTL = 1000 * 60 * 60 * 24 * 7; // 7d

class AuthService {

  static async createUser(user: User) {
    const existing = await db<UserRow>('users')
      .where({ username: user.username })
      .orWhere({ email: user.email })
      .first();
    if (existing) throw new Error('User already exists with that username or email');
    // create invite token
    const invite_token = crypto.randomBytes(6).toString('hex');
    const invite_token_expires = new Date(Date.now() + INVITE_TTL);
    // VULNERABILIDAD: almacenar la contrasenia en texto plano expone credenciales ante una brecha.
    // await db<UserRow>('users')
    //   .insert({
    //     username: user.username,
    //     password: user.password,
    //     email: user.email,
    //     first_name: user.first_name,
    //     last_name:  user.last_name,
    //     invite_token,
    //     invite_token_expires,
    //     activated: false
    //   });

    // MITIGACIÓN: hash de contraseñas antes de persistirlas.
    const hashedPassword = await bcrypt.hash(user.password, 12);
    await db<UserRow>('users')
      .insert({
        username: user.username,
        password: hashedPassword,
        email: user.email,
        first_name: user.first_name,
        last_name:  user.last_name,
        invite_token,
        invite_token_expires,
        activated: false
      });
      // send invite email using nodemailer and local SMTP server
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    const link = `${process.env.FRONTEND_URL}/activate-user?token=${invite_token}&username=${user.username}`;
   
    // VULNERABILIDAD: interpolar valores controlados por el usuario directamente en la plantilla permite ejecutar código EJS arbitrario.
    // const template = `
    //   <html>
    //     <body>
    //       <h1>Hello ${user.first_name} ${user.last_name}</h1>
    //       <p>Click <a href="${ link }">here</a> to activate your account.</p>
    //     </body>
    //   </html>`;
    // const htmlBody = ejs.render(template);

    // MITIGACIÓN: usar placeholders de EJS y pasar los datos como contexto para que se escapen automáticamente.
    const template = `
      <html>
        <body>
          <h1>Hello <%= firstName %> <%= lastName %></h1>
          <p>Click <a href="<%= activationLink %>">here</a> to activate your account.</p>
        </body>
      </html>`;
    const htmlBody = ejs.render(template, {
      firstName: user.first_name,
      lastName: user.last_name,
      activationLink: link
    });
    
    await transporter.sendMail({
      from: "info@example.com",
      to: user.email,
      subject: 'Activate your account',
      html: htmlBody
    });
  }

  static async updateUser(user: User) {
    const existing = await db<UserRow>('users')
      .where({ id: user.id })
      .first();
    if (!existing) throw new Error('User not found');
    // VULNERABILIDAD: actualizar la contrasenia sin hash mantiene el almacén inseguro.
    // await db<UserRow>('users')
    //   .where({ id: user.id })
    //   .update({
    //     username: user.username,
    //     password: user.password,
    //     email: user.email,
    //     first_name: user.first_name,
    //     last_name: user.last_name
    //   });

    // MITIGACIÓN: recalcular el hash cuando se actualiza la contrasenia.
    const updatedPassword = user.password
      ? await bcrypt.hash(user.password, 12)
      : existing.password;
    await db<UserRow>('users')
      .where({ id: user.id })
      .update({
        username: user.username,
        password: updatedPassword,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      });
    return existing;
  }

  static async authenticate(username: string, password: string) {
    const user = await db<UserRow>('users')
      .where({ username })
      .andWhere('activated', true)
      .first();
    if (!user) throw new Error('Invalid email or not activated');
    // VULNERABILIDAD: comparar textos planos permite que contraseñas en la base sigan sin hash.
    // if (password != user.password) throw new Error('Invalid password');

    // MITIGACIÓN: usar bcrypt.compare contra el hash almacenado.
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) throw new Error('Invalid password');
    return user;
  }

  static async sendResetPasswordEmail(email: string) {
    const user = await db<UserRow>('users')
      .where({ email })
      .andWhere('activated', true)
      .first();
    if (!user) throw new Error('No user with that email or not activated');

    const token = crypto.randomBytes(6).toString('hex');
    const expires = new Date(Date.now() + RESET_TTL);

    await db('users')
      .where({ id: user.id })
      .update({
        reset_password_token: token,
        reset_password_expires: expires
      });

    // send email with reset link using nodemailer and local SMTP server
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      to: user.email,
      subject: 'Your password reset link',
      html: `Click <a href="${link}">here</a> to reset your password.`
    });
  }

  static async resetPassword(token: string, newPassword: string) {
    const row = await db<UserRow>('users')
      .where('reset_password_token', token)
      .andWhere('reset_password_expires', '>', new Date())
      .first();
    if (!row) throw new Error('Invalid or expired reset token');

    // VULNERABILIDAD: guardar el nuevo password sin hash mantiene el riesgo.
    // await db('users')
    //   .where({ id: row.id })
    //   .update({
    //     password: newPassword,
    //     reset_password_token: null,
    //     reset_password_expires: null
    //   });

    // MITIGACIÓN: persistir solo el hash de la nuevo contrasenia.
    const hashedResetPassword = await bcrypt.hash(newPassword, 12);
    await db('users')
      .where({ id: row.id })
      .update({
        password: hashedResetPassword,
        reset_password_token: null,
        reset_password_expires: null
      });
  }

  static async setPassword(token: string, newPassword: string) {
    const row = await db<UserRow>('users')
      .where('invite_token', token)
      .andWhere('invite_token_expires', '>', new Date())
      .first();
    if (!row) throw new Error('Invalid or expired invite token');

    // VULNERABILIDAD: almacenar la contrasenia de activación en claro.
    // await db('users')
    //   .update({
    //     password: newPassword,
    //     invite_token: null,
    //     invite_token_expires: null
    //   })
    //   .where({ id: row.id });

    // MITIGACIÓN: hash antes de activar la cuenta.
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await db('users')
      .update({
        password: hashedNewPassword,
        invite_token: null,
        invite_token_expires: null
      })
      .where({ id: row.id });
  }

  static generateJwt(userId: string): string {
    return jwtUtils.generateToken(userId);
  }
}

export default AuthService;
