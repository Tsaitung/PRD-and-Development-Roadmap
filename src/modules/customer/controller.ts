import { Request, Response, NextFunction } from 'express';
import * as customerService from './service';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';

export const createCustomer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerData = {
      ...req.body,
      createdBy: req.user?.id || ''
    };

    const customer = await customerService.createCustomer(customerData);

    logger.info({
      message: 'Customer created',
      customerCode: customer.customerCode,
      customerId: customer.id,
      userId: req.user?.id
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customerId } = req.params;
    
    const customer = await customerService.getCustomerById(customerId);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customerId } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id || ''
    };

    const customer = await customerService.updateCustomer(customerId, updateData);

    logger.info({
      message: 'Customer updated',
      customerId,
      changes: Object.keys(req.body),
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const searchCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter = {
      search: req.query.search as string,
      customerType: req.query.customerType ? 
        (req.query.customerType as string).split(',') : undefined,
      status: req.query.status ? 
        (req.query.status as string).split(',') : undefined,
      tierLevel: req.query.tierLevel ? 
        (req.query.tierLevel as string).split(',').map(Number) : undefined,
      minSpend: req.query.minSpend ? Number(req.query.minSpend) : undefined,
      maxSpend: req.query.maxSpend ? Number(req.query.maxSpend) : undefined,
      salesRepId: req.query.salesRepId as string,
      tags: req.query.tags ? 
        (req.query.tags as string).split(',') : undefined,
      hasOverdue: req.query.hasOverdue === 'true',
      lastPurchaseDays: req.query.lastPurchaseDays ? 
        Number(req.query.lastPurchaseDays) : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await customerService.searchCustomers(filter);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customerId } = req.params;
    
    const analytics = await customerService.getCustomerAnalytics(customerId);

    res.json({
      success: true,
      data: analytics,
      calculatedAt: analytics.calculatedAt
    });
  } catch (error) {
    next(error);
  }
};

export const adjustCustomerCredit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const adjustmentData = {
      ...req.body,
      adjustedBy: req.user?.id || ''
    };

    const credit = await customerService.adjustCustomerCredit(adjustmentData);

    logger.info({
      message: 'Customer credit adjusted',
      customerId: req.body.customerId,
      adjustmentType: req.body.adjustmentType,
      amount: req.body.amount,
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: credit,
      message: 'Credit limit adjusted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerTiers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tiers = await customerService.getCustomerTiers();

    res.json({
      success: true,
      data: tiers,
      count: tiers.length
    });
  } catch (error) {
    next(error);
  }
};