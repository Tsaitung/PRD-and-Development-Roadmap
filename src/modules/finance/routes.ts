import { Router } from 'express';
import * as controller from './controller';
import { validateRequest } from './validation';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// All finance endpoints require authentication
router.use(authenticate);

// Invoice Management
router.post('/invoices',
  authorize(['finance.invoice.create']),
  validateRequest('createInvoice'),
  controller.createInvoice
);

router.get('/invoices/:invoiceId',
  authorize(['finance.invoice.view']),
  controller.getInvoice
);

// Payment Processing
router.post('/payments',
  authorize(['finance.payment.create']),
  validateRequest('processPayment'),
  controller.processPayment
);

// Financial Reports
router.get('/reports/:reportType',
  authorize(['finance.reports.view']),
  controller.generateReport
);

// Tax Calculation
router.post('/tax/calculate',
  authorize(['finance.tax.calculate']),
  validateRequest('calculateTax'),
  controller.calculateTax
);

export default router;