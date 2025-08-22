import { Router } from 'express';
import * as controller from './controller';
import { validateRequest } from './validation';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Public endpoint - dashboard view
router.get('/dashboard', controller.getProductionDashboard);

// Protected endpoints
router.use(authenticate);

// Work order management
router.post('/work-orders',
  authorize(['production.workorder.create']),
  validateRequest('createWorkOrder'),
  controller.createWorkOrder
);

router.get('/work-orders/:workOrderId',
  authorize(['production.workorder.view']),
  controller.getWorkOrder
);

// Task management
router.patch('/tasks/:taskId/status',
  authorize(['production.task.update']),
  validateRequest('updateTaskStatus'),
  controller.updateTaskStatus
);

// Metrics and monitoring
router.get('/workstations/:workstationId/metrics',
  authorize(['production.metrics.view']),
  controller.getWorkstationMetrics
);

router.get('/metrics',
  authorize(['production.metrics.view']),
  controller.getWorkstationMetrics
);

export default router;