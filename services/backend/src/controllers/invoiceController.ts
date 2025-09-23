import { Request, Response, NextFunction } from 'express';
import InvoiceService from '../services/invoiceService';
import { Invoice } from '../types/invoice';

const listInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = req.query.status as string | undefined;
    const operator = req.query.operator as string | undefined;
    const id   = (req as any).user!.id; 
    const invoices = await InvoiceService.list(id, state,operator);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
};

const setPaymentCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = req.params.id;
    // VULNERABILIDAD: Almacenamiento Inseguro de Información Sensible
    // CWE-922: Insecure Storage of Sensitive Information
    // Los datos de tarjeta de crédito (número, CCV, fecha de expiración) se manejan en texto plano
    // y se envían a servicios externos sin cifrado adicional.
    // Los datos de tarjetas deberían ser tokenizados y nunca almacenados o transmitidos en texto plano.
    const paymentBrand = req.body.paymentBrand;
    const ccNumber = req.body.ccNumber;
    const ccv = req.body.ccv;
    const expirationDate = req.body.expirationDate;

    if (!paymentBrand || !ccNumber || !ccv || !expirationDate) {
      return res.status(400).json({ error: 'Missing payment details' });
    }
    const id   = (req as any).user!.id; 
    await InvoiceService.setPaymentCard(
      id,
      invoiceId,
      paymentBrand,
      ccNumber,
      ccv,
      expirationDate
    );

    res.status(200).json({ message: 'Payment successful' });
  } catch (err) {
    next(err);
  }
};

const getInvoicePDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = req.params.id;
    const pdfName = req.query.pdfName as string | undefined;

    if (!pdfName) {
      return res.status(400).json({ error: 'Missing parameter pdfName' });
    }
    // VULNERABILIDAD: Missing Authorization
    // CWE-862: Missing Authorization
    // Similar al problema anterior, no se verifica si el usuario tiene derecho a descargar
    // el PDF de esta factura específica. Un atacante podría acceder a PDFs de otros usuarios.
    // Esto no es seguro
    const pdf = await InvoiceService.getReceipt(invoiceId, pdfName);
    // return the pdf as a binary response
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdf);

  } catch (err) {
    next(err);
  }
};

const getInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = req.params.id;
    // VULNERABILIDAD: Missing Authorization
    // CWE-862: Missing Authorization
    // Esta función no verifica si el usuario autenticado tiene derecho a acceder a esta factura específica.
    // Un atacante podría cambiar el ID en la URL para acceder a facturas de otros usuarios.
    // Debería verificar que la factura pertenezca al usuario autenticado antes de devolverla.
    // Esto no es seguro
    const invoice = await InvoiceService.getInvoice(invoiceId);
    res.status(200).json(invoice);

  } catch (err) {
    next(err);
  }
};

export default {
  listInvoices,
  setPaymentCard,
  getInvoice,
  getInvoicePDF
};