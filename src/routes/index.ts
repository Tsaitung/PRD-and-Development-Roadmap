import { Router } from 'express';
import warehouseRoutes from '../modules/warehouse/routes';

const router = Router();

// Module routes
router.use('/warehouses', warehouseRoutes);

// Default route
router.get('/', (req, res) => {
  res.json({
    message: '菜蟲農食 ERP API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default router;