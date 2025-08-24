import { Router } from 'express';
import * as controller from './controller';
import { validateRequest } from './validation';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Public endpoints (none - all customer data requires auth)

// Protected endpoints
router.use(authenticate);

// Customer CRUD
router.post('/',
  authorize(['customer.create']),
  validateRequest('createCustomer'),
  controller.createCustomer
);

router.get('/:customerId',
  authorize(['customer.view']),
  controller.getCustomer
);

router.patch('/:customerId',
  authorize(['customer.update']),
  validateRequest('updateCustomer'),
  controller.updateCustomer
);

// Customer Search & Analytics
router.get('/',
  authorize(['customer.view']),
  controller.searchCustomers
);

router.get('/:customerId/analytics',
  authorize(['customer.analytics']),
  controller.getCustomerAnalytics
);

// Credit Management
router.post('/credit/adjust',
  authorize(['customer.credit.manage']),
  validateRequest('adjustCredit'),
  controller.adjustCustomerCredit
);

// Reference Data
router.get('/tiers/list',
  authorize(['customer.view']),
  controller.getCustomerTiers
);

export default router;