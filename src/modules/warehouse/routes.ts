import { Router } from 'express';
import * as controller from './controller';
import * as batchController from './batch.controller';
import * as stockCountController from './stockcount.controller';
import { validateRequest } from './validation';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Public endpoints (read-only)
router.get('/inventory', controller.getInventoryOverview);
router.get('/:warehouseId/inventory', controller.getInventoryOverview);
router.get('/:warehouseId/inventory/:itemId', controller.getInventoryByItem);

// Protected endpoints
router.use(authenticate); // All routes below require authentication

// Inventory management
router.get('/:warehouseId/transactions', controller.getInventoryTransactions);
router.get('/:warehouseId/alerts/low-stock', controller.getLowStockAlerts);
router.get('/:warehouseId/alerts/expiry', controller.getExpiryAlerts);
router.post('/:warehouseId/adjust', 
  authorize(['warehouse.adjust']), 
  validateRequest('adjust'), 
  controller.adjustInventory
);
router.post('/transfer', 
  authorize(['warehouse.transfer']), 
  validateRequest('transfer'), 
  controller.transferInventory
);

// Batch management
router.get('/batches/:itemId', batchController.getBatchesByItem);
router.post('/batches', 
  authorize(['warehouse.batch.create']), 
  validateRequest('createBatch'),
  batchController.createBatch
);
router.post('/batches/transfer', 
  authorize(['warehouse.batch.transfer']), 
  validateRequest('transferBatch'),
  batchController.transferBatch
);
router.put('/batches/:batchId/quarantine', 
  authorize(['warehouse.batch.quarantine']), 
  batchController.quarantineBatch
);

// Stock counting
router.get('/:warehouseId/stockcount/history', stockCountController.getStockCountHistory);
router.post('/stockcount/sessions', 
  authorize(['warehouse.stockcount.create']), 
  validateRequest('createStockCount'),
  stockCountController.createStockCountSession
);
router.get('/stockcount/sessions/:sessionId', stockCountController.getStockCountSession);
router.put('/stockcount/sessions/:sessionId/start', 
  authorize(['warehouse.stockcount.perform']), 
  stockCountController.startStockCount
);
router.post('/stockcount/sessions/:sessionId/items/:itemId', 
  authorize(['warehouse.stockcount.perform']), 
  validateRequest('submitCount'),
  stockCountController.submitItemCount
);
router.get('/stockcount/sessions/:sessionId/variance', stockCountController.getVarianceReport);
router.post('/stockcount/sessions/:sessionId/approve', 
  authorize(['warehouse.stockcount.approve']), 
  stockCountController.approveAndAdjust
);

export default router;