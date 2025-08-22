import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../../middleware/errorHandler';

const schemas = {
  adjust: Joi.object({
    itemId: Joi.string().uuid().required(),
    batchId: Joi.string().uuid().optional(),
    adjustmentType: Joi.string().valid('increase', 'decrease', 'set').required(),
    quantity: Joi.number().positive().required(),
    reason: Joi.string().required(),
    notes: Joi.string().optional()
  }),

  transfer: Joi.object({
    fromWarehouseId: Joi.string().uuid().required(),
    toWarehouseId: Joi.string().uuid().required(),
    itemId: Joi.string().uuid().required(),
    batchId: Joi.string().uuid().optional(),
    quantity: Joi.number().positive().required(),
    expectedDate: Joi.date().optional(),
    notes: Joi.string().optional()
  }),

  createBatch: Joi.object({
    batchNo: Joi.string().required(),
    itemId: Joi.string().uuid().required(),
    warehouseId: Joi.string().uuid().required(),
    quantity: Joi.number().positive().required(),
    productionDate: Joi.date().optional(),
    expiryDate: Joi.date().optional(),
    supplierId: Joi.string().uuid().optional(),
    supplierBatchNo: Joi.string().optional(),
    qualityGrade: Joi.string().optional(),
    location: Joi.string().optional()
  }),

  transferBatch: Joi.object({
    batchId: Joi.string().uuid().required(),
    fromWarehouseId: Joi.string().uuid().required(),
    toWarehouseId: Joi.string().uuid().required(),
    quantity: Joi.number().positive().required(),
    notes: Joi.string().optional()
  }),

  createStockCount: Joi.object({
    warehouseId: Joi.string().uuid().required(),
    countType: Joi.string().valid('full', 'cycle', 'spot').required(),
    itemIds: Joi.array().items(Joi.string().uuid()).optional(),
    plannedDate: Joi.date().optional(),
    notes: Joi.string().optional()
  }),

  submitCount: Joi.object({
    countedQty: Joi.number().min(0).required(),
    notes: Joi.string().optional()
  })
};

export const validateRequest = (schemaName: keyof typeof schemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return next(new AppError('Invalid validation schema', 500));
    }

    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors
        }
      });
    }
    
    next();
  };
};