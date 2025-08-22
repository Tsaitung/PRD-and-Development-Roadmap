import { Request, Response, NextFunction } from 'express';
import * as productionService from './service';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';

export const createWorkOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const workOrderData = {
      ...req.body,
      createdBy: req.user?.id || ''
    };

    const workOrder = await productionService.createWorkOrder(workOrderData);

    logger.info({
      message: 'Work order created',
      workOrderNo: workOrder.work_order_no,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: workOrder,
      message: 'Work order created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workOrderId } = req.params;
    
    const workOrder = await productionService.getWorkOrderWithTasks(workOrderId);

    res.json({
      success: true,
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { taskId } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id || ''
    };

    const task = await productionService.updateTaskStatus(taskId, updateData);

    logger.info({
      message: 'Task status updated',
      taskId,
      newStatus: req.body.status,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: task,
      message: `Task ${req.body.status === 'completed' ? 'completed' : 'updated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkstationMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { workstationId } = req.params;
    const query = {
      workstationId: workstationId || req.query.workstationId as string,
      dateFrom: new Date(req.query.dateFrom as string || 
        new Date().setDate(new Date().getDate() - 7)),
      dateTo: new Date(req.query.dateTo as string || new Date()),
      groupBy: req.query.groupBy as any || 'day',
      includeDefects: req.query.includeDefects === 'true'
    };

    const metrics = await productionService.getWorkstationMetrics(query);

    res.json({
      success: true,
      data: metrics,
      period: {
        from: query.dateFrom,
        to: query.dateTo
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductionDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const dashboard = await productionService.getProductionDashboard();

    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};