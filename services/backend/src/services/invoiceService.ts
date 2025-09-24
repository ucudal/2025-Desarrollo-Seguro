// src/services/invoiceService.ts
import db from '../db';
import { Invoice } from '../types/invoice';
import axios from 'axios';
import { promises as fs } from 'fs';
import * as path from 'path';
import { promises as dns } from 'dns';

interface InvoiceRow {
  id: string;
  userId: string;
  amount: number;
  dueDate: Date;
  status: string;
}

class InvoiceService {
  static async list(userId: string, status?: string, operator?: string): Promise<Invoice[]> {
    let q = db<InvoiceRow>('invoices').where({ userId: userId });

    if (status) {
      // Normalizar y validar status
      const stat = String(status).trim();
      if (stat.length === 0 || stat.length > 200) {
        throw new Error('Invalid status value');
      }

      // Whitelist de operadores permitidos
      const allowedOperators = ['=', '<>', '!=', '<', '<=', '>', '>=', 'LIKE'];
      const op = (operator || '=').toUpperCase();

      if (!allowedOperators.includes(op)) {
        throw new Error('Invalid operator');
      }

      // Usar binding en la consulta
      q = q.andWhere('status', op as any, stat);
    }

    const rows = await q.select();
    const invoices = rows.map(row => ({
      id: row.id,
      userId: row.userId,
      amount: row.amount,
      dueDate: row.dueDate,
      status: row.status
    } as Invoice));

    return invoices;
  }


  static async setPaymentCard(
    userId: string,
    invoiceId: string,
    paymentBrand: string,
    ccNumber: string,
    ccv: string,
    expirationDate: string
  ) {
    // VULNERABILIDAD SSRF (CWE-918):
    // Esta línea permite que el cliente controle el host y puerto de destino de la petición.
    // const paymentResponse = await axios.post(`http://${paymentBrand}/payments`, {
    //   ccNumber,
    //   ccv,
    //   expirationDate
    // });

    // MITIGACIÓN aplicada:
    // Se valida el hostname, resolviendo su IP y bloqueando redes privadas (127.*, 10.*, etc).
    // También se establece un timeout y se impide seguir redirecciones.
    const url = new URL(`http://${paymentBrand}/payments`);
    const hostname = url.hostname;

    const isPrivateIp = (ip: string): boolean =>
      /^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2[0-9]|3[0-1])/.test(ip);

    const lookupResult = await dns.lookup(hostname, { family: 4 });
    const address = typeof lookupResult === 'string' ? lookupResult : lookupResult.address;

    if (!address) {
      throw new Error('No se pudo resSolver el host de destino');
    }

    if (isPrivateIp(address)) {
      throw new Error('Destino interno no permitido');
    }

    const paymentResponse = await axios.post(url.toString(), {
      ccNumber,
      ccv,
      expirationDate
    }, {
      timeout: 5000,
      maxRedirects: 0
    });
    if (paymentResponse.status !== 200) {
      throw new Error('Payment failed');
    }

    // Update the invoice status in the database
    await db('invoices')
      .where({ id: invoiceId, userId })
      .update({ status: 'paid' });  
    };
  static async  getInvoice( invoiceId:string): Promise<Invoice> {
    const invoice = await db<InvoiceRow>('invoices').where({ id: invoiceId }).first();
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice as Invoice;
  }


  static async getReceipt(
    invoiceId: string,
    pdfName: string
  ) {
    // check if the invoice exists
    const invoice = await db<InvoiceRow>('invoices').where({ id: invoiceId }).first();
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    try {
      const filePath = `/invoices/${pdfName}`;
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      // send the error to the standard output
      console.error('Error reading receipt file:', error);
      throw new Error('Receipt not found');

    } 

  };

};

export default InvoiceService;
