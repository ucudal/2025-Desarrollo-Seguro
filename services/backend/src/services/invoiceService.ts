// src/services/invoiceService.ts
import db from '../db';
import { Invoice } from '../types/invoice';
import axios from 'axios';
import { promises as fs } from 'fs';
import * as path from 'path';

interface InvoiceRow {
  id: string;
  userId: string;
  amount: number;
  dueDate: Date;
  status: string;
}

class InvoiceService {
    // Mitigación Path Traversal: validar nombre de archivo
    let q = db<InvoiceRow>('invoices').where({ userId: userId });
    // Mitigación: solo permitir operadores válidos
    const allowedOperators = ['=', '!='];
    if (status && operator && allowedOperators.includes(operator)) {
      q = q.andWhere('status', operator, status);
    const filePath = path.join(baseDir, pdfName);
    // Verificar que la ruta final esté dentro del directorio permitido
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
    // Mitigación SSRF: whitelist de marcas y URLs
    const allowedBrands = ['visa', 'mastercard', 'amex'];
    if (!allowedBrands.includes(paymentBrand)) {
      throw new Error('Invalid payment brand');
    }
    const brandUrls: Record<string, string> = {
      visa: 'http://visa-service/payments',
      mastercard: 'http://mastercard-service/payments',
      amex: 'http://amex-service/payments',
    };
    const url = brandUrls[paymentBrand];
    const paymentResponse = await axios.post(url, {
      ccNumber,
      ccv,
      expirationDate
    });
    if (paymentResponse.status !== 200) {
      throw new Error('Payment failed');
    }
    // Update the invoice status in the database
    await db('invoices')
      .where({ id: invoiceId, userId })
      .update({ status: 'paid' });
  }
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
    // Mitigación: Validar nombre de archivo
    if (!/^[\w,\s-]+\.pdf$/.test(pdfName)) {
      throw new Error('Invalid file name');
    }
    // Usar path seguro
    const baseDir = '/invoices';
    const filePath = path.join(baseDir, pdfName);
    // Verificar que la ruta final esté dentro del directorio permitido
    if (!filePath.startsWith(baseDir)) {
      throw new Error('Path traversal detected');
    }
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error reading receipt file:', error);
      throw new Error('Receipt not found');
    }
  }

};

export default InvoiceService;
