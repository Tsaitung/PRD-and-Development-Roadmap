import { Request, Response, NextFunction } from 'express';
import * as warehouseService from './service';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

/**
 * @swagger
 * /warehouses/{warehouseId}/inventory:
 *   get:
 *     summary: Get inventory overview for a warehouse
 *     tags: [Warehouse]
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Warehouse ID
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: minQuantity
 *         schema:
 *           type: number
 *         description: Minimum quantity filter
 *       - in: query
 *         name: maxQuantity
 *         schema:
 *           type: number
 *         description: Maximum quantity filter
 *     responses:
 *       200:
 *         description: Inventory overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 summary:
 *                   type: object
 */
export const getInventoryOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { warehouseId } = req.params;
    const queryParams = {
      warehouseId,
      includeReserved: req.query.includeReserved === 'true',
      includeBatches: req.query.includeBatches === 'true',
      minQuantity: req.query.minQuantity ? Number(req.query.minQuantity) : undefined,
      maxQuantity: req.query.maxQuantity ? Number(req.query.maxQuantity) : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any
    };

    const result = await warehouseService.getInventoryOverview(queryParams);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: result.summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /warehouses/{warehouseId}/inventory/{itemId}:
 *   get:
 *     summary: Get inventory for specific item in warehouse
 *     tags: [Warehouse]
 *     parameters:
 *       - in: path
 *         name: warehouseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item inventory retrieved
 *       404:
 *         description: Item not found in warehouse
 */
export const getInventoryByItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { warehouseId, itemId } = req.params;
    
    if (!itemId) {
      throw new AppError('Item ID is required', 400);
    }

    const inventory = await warehouseService.getInventoryByItem(warehouseId, itemId);

    if (!inventory) {
      throw new AppError('Inventory record not found', 404);
    }

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

export const adjustInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { warehouseId } = req.params;
    const adjustmentRequest = {
      ...req.body,
      warehouseId,
      createdBy: (req as any).user?.id // Assuming user is attached by auth middleware
    };

    const result = await warehouseService.adjustInventory(adjustmentRequest);

    res.json({
      success: true,
      data: result,
      message: 'Inventory adjusted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const transferInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const transferRequest = {
      ...req.body,
      createdBy: (req as any).user?.id
    };

    const result = await warehouseService.transferInventory(transferRequest);

    res.json({
      success: true,
      data: result,
      message: 'Transfer initiated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { warehouseId } = req.params;
    const filters = {
      warehouseId,
      itemId: req.query.itemId as string,
      transactionType: req.query.type as any,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 50
    };

    const result = await warehouseService.getInventoryTransactions(filters);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStockAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { warehouseId } = req.params;
    
    const alerts = await warehouseService.getLowStockAlerts(warehouseId);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiryAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { warehouseId } = req.params;
    const daysAhead = req.query.days ? Number(req.query.days) : 30;
    
    const alerts = await warehouseService.getExpiryAlerts(warehouseId, daysAhead);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    next(error);
  }
};