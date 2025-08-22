import { Request, Response, NextFunction } from 'express';
import * as stockCountService from './stockcount.service';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

export const createStockCountSession = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionData = {
      ...req.body,
      createdBy: req.user?.id || ''
    };

    const session = await stockCountService.createStockCountSession(sessionData);

    res.status(201).json({
      success: true,
      data: session,
      message: 'Stock count session created successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getStockCountSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stockCountService.getStockCountSession(sessionId);

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

export const startStockCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stockCountService.startStockCount(sessionId);

    res.json({
      success: true,
      data: session,
      message: 'Stock count session started'
    });
  } catch (error) {
    next(error);
  }
};

export const submitItemCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId, itemId } = req.params;
    const { countedQty, notes } = req.body;

    if (countedQty === undefined || countedQty === null) {
      throw new AppError('Counted quantity is required', 400);
    }

    const countItem = await stockCountService.submitItemCount(
      sessionId,
      itemId,
      Number(countedQty),
      req.user?.id || '',
      notes
    );

    res.json({
      success: true,
      data: countItem,
      message: 'Count submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getVarianceReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    
    const report = await stockCountService.getVarianceReport(sessionId);

    res.json({
      success: true,
      data: report.items,
      summary: report.summary
    });
  } catch (error) {
    next(error);
  }
};

export const approveAndAdjust = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const { adjustItems = true } = req.body;

    const result = await stockCountService.approveAndAdjust(
      sessionId,
      req.user?.id || '',
      adjustItems
    );

    res.json({
      success: true,
      data: result,
      message: adjustItems 
        ? 'Stock count approved and inventory adjusted'
        : 'Stock count approved without adjustments'
    });
  } catch (error) {
    next(error);
  }
};

export const getStockCountHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { warehouseId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    const history = await stockCountService.getStockCountHistory(
      warehouseId,
      limit
    );

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    next(error);
  }
};