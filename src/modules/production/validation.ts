import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../../middleware/errorHandler';

const schemas = {
  createWorkOrder: Joi.object({
    itemId: Joi.string().uuid().required(),
    plannedQuantity: Joi.number().positive().required(),
    unitId: Joi.string().uuid().required(),
    plannedStart: Joi.date().iso().required(),
    plannedEnd: Joi.date().iso().min(Joi.ref('plannedStart')).required(),
    priority: Joi.number().integer().min(0).max(10).optional(),
    qualityCheckRequired: Joi.boolean().optional(),
    notes: Joi.string().max(500).optional()
  }),

  updateTaskStatus: Joi.object({
    status: Joi.string()
      .valid('ready', 'in_progress', 'completed', 'cancelled')
      .required(),
    completedQuantity: Joi.number()
      .positive()
      .when('status', {
        is: 'completed',
        then: Joi.required(),
        otherwise: Joi.optional()
      }),
    defectQuantity: Joi.number()
      .min(0)
      .optional(),
    notes: Joi.string().max(500).optional(),
    operatorIds: Joi.array()
      .items(Joi.string().uuid())
      .optional()
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