import { Request, Response, NextFunction } from 'express';
import * as orderService from './service';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';

export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderData = {
      ...req.body,
      createdBy: req.user?.id || ''
    };

    const order = await orderService.createOrder(orderData);

    logger.info({
      message: 'Order created',
      orderNo: order.orderNo,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    
    const order = await orderService.getOrderById(orderId);

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id || ''
    };

    const order = await orderService.updateOrderStatus(orderId, updateData);

    logger.info({
      message: 'Order status updated',
      orderId,
      newStatus: req.body.status,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: order,
      message: `Order status updated to ${req.body.status}`
    });
  } catch (error) {
    next(error);
  }
};

export const searchOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter = {
      customerId: req.query.customerId as string,
      status: req.query.status ? (req.query.status as string).split(',') : undefined,
      paymentStatus: req.query.paymentStatus ? 
        (req.query.paymentStatus as string).split(',') : undefined,
      deliveryStatus: req.query.deliveryStatus ? 
        (req.query.deliveryStatus as string).split(',') : undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
      minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
      salesChannel: req.query.salesChannel as string,
      searchTerm: req.query.search as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await orderService.searchOrders(filter);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const calculatePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pricingRequest = req.body;
    
    const pricing = await orderService.calculateOrderPricing(pricingRequest);

    res.json({
      success: true,
      data: pricing,
      message: 'Pricing calculated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const dateFrom = req.query.dateFrom ? 
      new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? 
      new Date(req.query.dateTo as string) : undefined;

    const statistics = await orderService.getOrderStatistics(dateFrom, dateTo);

    res.json({
      success: true,
      data: statistics,
      period: {
        from: dateFrom || 'all-time',
        to: dateTo || 'now'
      }
    });
  } catch (error) {
    next(error);
  }
};