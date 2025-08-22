import { Router } from 'express';
import * as controller from './controller';
import { validateRequest } from './validation';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Public endpoints (none for orders - all require auth)

// Protected endpoints
router.use(authenticate);

// Order CRUD
router.post('/',
  authorize(['order.create']),
  validateRequest('createOrder'),
  controller.createOrder
);

router.get('/:orderId',
  authorize(['order.view']),
  controller.getOrder
);

router.patch('/:orderId/status',
  authorize(['order.update.status']),
  validateRequest('updateStatus'),
  controller.updateOrderStatus
);

// Order Search & Analytics
router.get('/',
  authorize(['order.view']),
  controller.searchOrders
);

router.post('/calculate-pricing',
  authorize(['order.create']),
  validateRequest('calculatePricing'),
  controller.calculatePricing
);

router.get('/statistics/overview',
  authorize(['order.analytics']),
  controller.getOrderStatistics
);

export default router;