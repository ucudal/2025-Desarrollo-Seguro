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
  static async list( userId: string, status?: string, operator?: string): Promise<Invoice[]> {
    let q = db<InvoiceRow>('invoices').where({ userId: userId });
    // VULNERABILIDAD: Inyección SQL (SQL Injection)
    // CWE-89: Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')
    // La línea siguiente construye dinámicamente una consulta SQL concatenando directamente 
    // el parámetro 'operator' y 'status' sin sanitización ni validación.
    // Un atacante podría enviar valores maliciosos como operator="OR 1=1 --" 
    // para manipular la consulta y acceder a datos no autorizados.
    if (status) q = q.andWhereRaw(" status "+ operator + " '"+ status +"'");
    const rows = await q.select();
    const invoices = rows.map(row => ({
      id: row.id,
      userId: row.userId,
      amount: row.amount,
      dueDate: row.dueDate,
      status: row.status} as Invoice
    ));
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
    // VULNERABILIDAD: Server-Side Request Forgery (SSRF)
    // CWE-918: Server-Side Request Forgery (SSRF)
    // El código construye una URL usando directamente el parámetro 'paymentBrand' sin validación.
    // Un atacante podría enviar valores como "localhost:22/admin" o "169.254.169.254/metadata"
    // para realizar peticiones a servicios internos, APIs de metadatos de cloud, o endpoints administrativos.
    // Esto permite el acceso no autorizado a recursos internos de la red.
    // Esto no es seguro
    // use axios to call http://paymentBrand/payments as a POST request
    // with the body containing ccNumber, ccv, expirationDate
    // and handle the response accordingly
    const paymentResponse = await axios.post(`http://${paymentBrand}/payments`, {
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
      // VULNERABILIDAD: Path Traversal (Directory Traversal)
      // CWE-22: Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal')
      // El parámetro 'pdfName' se concatena directamente sin validación ni sanitización.
      // Un atacante podría enviar valores como "../../../etc/passwd" o "..\\..\\windows\\system32\\config\\sam"
      // para acceder a archivos fuera del directorio previsto y leer archivos sensibles del sistema.
      // Esto no es seguro
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
