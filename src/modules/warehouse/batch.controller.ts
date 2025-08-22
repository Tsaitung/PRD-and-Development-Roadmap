import { Request, Response, NextFunction } from 'express';
import * as batchService from './batch.service';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

export const createBatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const batchData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const batch = await batchService.createBatch(batchData);

    res.status(201).json({
      success: true,
      data: batch,
      message: 'Batch created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getBatchesByItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { itemId } = req.params;
    const { warehouseId, includeExpired } = req.query;

    const batches = await batchService.getBatchesByItem(
      itemId,
      warehouseId as string,
      includeExpired === 'true'
    );

    res.json({
      success: true,
      data: batches,
      count: batches.length
    });
  } catch (error) {
    next(error);
  }
};

export const transferBatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const transferData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const result = await batchService.transferBatch(transferData);

    res.json({
      success: true,
      data: result,
      message: 'Batch transfer completed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const quarantineBatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { batchId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError('Quarantine reason is required', 400);
    }

    const batch = await batchService.quarantineBatch(
      batchId,
      reason,
      req.user?.id || ''
    );

    res.json({
      success: true,
      data: batch,
      message: 'Batch quarantined successfully'
    });
  } catch (error) {
    next(error);
  }
};