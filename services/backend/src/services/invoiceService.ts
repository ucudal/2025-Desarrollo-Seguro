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
  //VULNERABILIDAD: SQL Injection al concatenar entradas del usuario sin previa validacion a la consulta SQL

  //MITIGACION: Validar las entradas del usuario y pasar status como binding en Knex

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
    // Esta lÃ­nea permite que el cliente controle el host y puerto de destino de la peticiÃ³n.
    // const paymentResponse = await axios.post(`http://${paymentBrand}/payments`, {
    //   ccNumber,
    //   ccv,
    //   expirationDate
    // });

    // MITIGACIÃ“N aplicada:
    // Se valida el hostname, resolviendo su IP y bloqueando redes privadas (127.*, 10.*, etc).
    // TambiÃ©n se establece un timeout y se impide seguir redirecciones.
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
  }

  // VULNERABILIDAD (Missing Authorization): la version original permitia acceder a facturas ajenas porque no verificaba el propietario.
  // static async getInvoice(invoiceId: string): Promise<Invoice> {
  //   const invoice = await db<InvoiceRow>('invoices').where({ id: invoiceId }).first();
  //   if (!invoice) {
  //     throw new Error('Invoice not found');
  //   }
  //   return invoice as Invoice;
  // }

  static async getInvoice(userId: string, invoiceId: string): Promise<Invoice> {
    // MITIGACION: se exige el userId y se filtra por el propietario antes de devolver la factura.
    const invoice = await db<InvoiceRow>('invoices')
      .where({ id: invoiceId, userId })
      .first();
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice as Invoice;
  }

  // VULNERABILIDAD (Missing Authorization): la version original permitia descargar recibos de facturas ajenas.
  // static async getReceipt(invoiceId: string, pdfName: string) {
  //
  //   const invoice = await db<InvoiceRow>("invoices")
  //     .where({ id: invoiceId })
  //     .first();
  //   if (!invoice) {
  //     throw new Error("Invoice not found");
  //   }
  //   try {
  //     // Sanitizamos entrada con la funcion sanitizeFilename
  //     const safePdfName = this.sanitizeFilename(pdfName);
  //
  //     const invoicesDir = path.resolve(process.cwd(), "invoices");
  //     const filePath = path.resolve(invoicesDir, safePdfName);
  //
  //     if (!filePath.startsWith(invoicesDir + path.sep)) {
  //       throw new Error("Invalid file path");
  //     }
  //
  //     const stat = await fs.stat(filePath);
  //     if (!stat.isFile()) {
  //       throw new Error("Invalid resource type");
  //     }
  //
  //     const content = await fs.readFile(filePath); // leer binario
  //     return content;
  //   } catch (error) {
  //     console.error("Error in getReceipt:", error.message);
  //
  //     //Diferenciar errores para probar endpoint
  //     const erroresConocidos = [
  //       "Invalid filename format",
  //       "Invalid file path",
  //       "Invalid resource type",
  //       "Invoice not found",
  //     ];
  //     
  //     if (erroresConocidos.includes(error.message)) {
  //       throw error;
  //     }
  //
  //     throw new Error("Receipt not found"); // fallback
  //   }
  // }

  static async getReceipt(userId: string, invoiceId: string, pdfName: string) {
    // MITIGACION: validamos la pertenencia de la factura antes de permitir el acceso al recibo.
    const invoice = await db<InvoiceRow>('invoices')
      .where({ id: invoiceId, userId })
      .first();
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    try {
      const safePdfName = this.sanitizeFilename(pdfName);

      const invoicesDir = path.resolve(process.cwd(), 'invoices');
      const filePath = path.resolve(invoicesDir, safePdfName);

      if (!filePath.startsWith(invoicesDir + path.sep)) {
        throw new Error('Invalid file path');
      }

      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        throw new Error('Invalid resource type');
      }

      const content = await fs.readFile(filePath); // leer binario
      return content;
    } catch (error) {
      console.error('Error in getReceipt:', error.message);

      //Diferenciar errores para probar endpoint
      const erroresConocidos = [
        'Invalid filename format',
        'Invalid file path',
        'Invalid resource type',
        'Invoice not found',
      ];
      
      if (erroresConocidos.includes(error.message)) {
        throw error;
      }

      throw new Error('Receipt not found'); // fallback
    }
  }

  //funcion para sanitizar el nombre del archivo
  private static sanitizeFilename(input: string): string {
    const decoded = decodeURIComponent(input);
    if (!/^[a-zA-Z0-9._-]+\.pdf$/i.test(decoded)) {
      throw new Error("Invalid filename format");
    }
    return decoded;
  }

};

export default InvoiceService;

