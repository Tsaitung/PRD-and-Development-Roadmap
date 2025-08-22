import { Router } from 'express';
import warehouseRoutes from '../modules/warehouse/routes';
import productionRoutes from '../modules/production/routes';

const router = Router();

// Module routes
router.use('/warehouses', warehouseRoutes);
router.use('/production', productionRoutes);

// Default route
router.get('/', (req, res) => {
  res.json({
    message: '菜蟲農食 ERP API',
    version: '1.0.0',
    modules: {
      warehouse: '/warehouses',
      production: '/production'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;