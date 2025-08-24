import { Request, Response, NextFunction } from 'express';
import * as financeService from './service';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';

/**
 * @swagger
 * /finance/invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceType
 *               - invoiceDate
 *               - dueDate
 *               - items
 *             properties:
 *               invoiceType:
 *                 type: string
 *                 enum: [sales, purchase]
 *               customerId:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               items:
 *                 type: array
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Invalid invoice data
 */
export const createInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const invoiceData = {
      ...req.body,
      createdBy: req.user?.id || ''
    };

    const invoice = await financeService.createInvoice(invoiceData);

    logger.info({
      message: 'Invoice created',
      invoiceNo: invoice.invoiceNo,
      invoiceId: invoice.id,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /finance/invoices/{invoiceId}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice details retrieved
 *       404:
 *         description: Invoice not found
 */
export const getInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId } = req.params;
    
    const invoice = await financeService.getInvoiceById(invoiceId);

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /finance/payments:
 *   post:
 *     summary: Process a payment
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invoiceId
 *               - amount
 *               - paymentMethod
 *               - paymentDate
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid payment data
 */
export const processPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentData = {
      ...req.body,
      createdBy: req.user?.id || ''
    };

    const payment = await financeService.processPayment(paymentData);

    logger.info({
      message: 'Payment processed',
      paymentNo: payment.paymentNo,
      amount: payment.amount,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: payment,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /finance/reports/{reportType}:
 *   get:
 *     summary: Generate financial report
 *     tags: [Finance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [balance_sheet, income_statement, cash_flow, aged_receivables, aged_payables]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, excel, csv]
 *     responses:
 *       200:
 *         description: Report generated successfully
 */
export const generateReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reportType } = req.params;
    
    const reportRequest = {
      reportType,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear(), 0, 1),
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : new Date(),
      format: req.query.format as any || 'json'
    };

    const report = await financeService.generateFinancialReport(reportRequest);

    logger.info({
      message: 'Financial report generated',
      reportType,
      format: reportRequest.format
    });

    res.json({
      success: true,
      data: report,
      generatedAt: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /finance/tax/calculate:
 *   post:
 *     summary: Calculate tax for items
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                     taxCode:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               isInclusive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tax calculated successfully
 */
export const calculateTax = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const calculation = await financeService.calculateTax(req.body);

    res.json({
      success: true,
      data: calculation
    });
  } catch (error) {
    next(error);
  }
};