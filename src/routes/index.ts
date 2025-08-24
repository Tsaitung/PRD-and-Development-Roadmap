import { Router } from 'express';
import warehouseRoutes from '../modules/warehouse/routes';
import productionRoutes from '../modules/production/routes';
import orderRoutes from '../modules/order/routes';
import customerRoutes from '../modules/customer/routes';
import financeRoutes from '../modules/finance/routes';

const router = Router();

// Module routes
router.use('/warehouses', warehouseRoutes);
router.use('/production', productionRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/finance', financeRoutes);

// Default route
router.get('/', (req, res) => {
  res.json({
    message: '菜蟲農食 ERP API',
    version: '1.0.0',
    modules: {
      warehouse: '/warehouses',
      production: '/production',
      orders: '/orders',
      customers: '/customers',
      finance: '/finance'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check with detailed status
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  };
  
  res.json(health);
});

export default router;