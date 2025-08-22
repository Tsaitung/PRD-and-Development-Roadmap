import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../../middleware/errorHandler';

const schemas = {
  createOrder: Joi.object({
    customerId: Joi.string().uuid().required(),
    orderType: Joi.string()
      .valid('standard', 'urgent', 'pre_order', 'subscription')
      .optional(),
    requestedDeliveryDate: Joi.date().iso().min('now').optional(),
    salesChannel: Joi.string()
      .valid('direct', 'online', 'phone', 'wholesale')
      .optional(),
    salesRepId: Joi.string().uuid().optional(),
    items: Joi.array().min(1).items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        quantity: Joi.number().positive().required(),
        unitPrice: Joi.number().positive().optional(),
        discountRate: Joi.number().min(0).max(1).optional(),
        notes: Joi.string().max(500).optional()
      })
    ).required(),
    deliveryAddress: Joi.object({
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().optional(),
      city: Joi.string().required(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      country: Joi.string().required(),
      contactPerson: Joi.string().optional(),
      contactPhone: Joi.string().optional(),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180)
      }).optional()
    }).required(),
    paymentMethod: Joi.string().optional(),
    paymentTerms: Joi.string().optional(),
    customerNotes: Joi.string().max(1000).optional(),
    internalNotes: Joi.string().max(1000).optional(),
    applyPromotion: Joi.string().optional()
  }),

  updateStatus: Joi.object({
    status: Joi.string()
      .valid(
        'draft', 'pending', 'confirmed', 'processing',
        'ready', 'shipped', 'delivered', 'completed',
        'cancelled', 'refunded'
      )
      .required(),
    notes: Joi.string().max(500).optional(),
    notifyCustomer: Joi.boolean().optional()
  }),

  calculatePricing: Joi.object({
    customerId: Joi.string().uuid().required(),
    items: Joi.array().min(1).items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        quantity: Joi.number().positive().required()
      })
    ).required(),
    deliveryAddress: Joi.object({
      addressLine1: Joi.string().required(),
      city: Joi.string().required(),
      country: Joi.string().required()
    }).optional(),
    promotionCode: Joi.string().optional(),
    useCredit: Joi.boolean().optional()
  })
};

export const validateRequest = (schemaName: keyof typeof schemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return next(new AppError('Invalid validation schema', 500));
    }

    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
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