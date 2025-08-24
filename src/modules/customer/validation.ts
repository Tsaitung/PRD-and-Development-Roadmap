import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../../middleware/errorHandler';

const schemas = {
  createCustomer: Joi.object({
    customerName: Joi.string().min(2).max(200).required(),
    customerType: Joi.string()
      .valid('individual', 'retailer', 'wholesaler', 'distributor', 'chain', 'online', 'export')
      .required(),
    taxId: Joi.string().optional(),
    primaryContact: Joi.object({
      name: Joi.string().required(),
      title: Joi.string().optional(),
      phone: Joi.string().required(),
      mobile: Joi.string().optional(),
      email: Joi.string().email().optional(),
      department: Joi.string().optional()
    }).required(),
    billingAddress: Joi.object({
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().optional(),
      city: Joi.string().required(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      country: Joi.string().required()
    }).required(),
    shippingAddress: Joi.object({
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().optional(),
      city: Joi.string().required(),
      state: Joi.string().optional(),
      postalCode: Joi.string().optional(),
      country: Joi.string().required()
    }).optional(),
    creditLimit: Joi.number().min(0).optional(),
    paymentTerms: Joi.string()
      .valid('COD', 'NET7', 'NET15', 'NET30', 'NET45', 'NET60', 'EOM')
      .optional(),
    salesRepId: Joi.string().uuid().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().max(1000).optional()
  }),

  updateCustomer: Joi.object({
    customerName: Joi.string().min(2).max(200).optional(),
    customerType: Joi.string()
      .valid('individual', 'retailer', 'wholesaler', 'distributor', 'chain', 'online', 'export')
      .optional(),
    tierLevel: Joi.number().min(1).max(5).optional(),
    status: Joi.string()
      .valid('prospect', 'active', 'inactive', 'suspended', 'blacklisted')
      .optional(),
    primaryContact: Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      email: Joi.string().email().optional()
    }).optional(),
    billingAddress: Joi.object({
      addressLine1: Joi.string().required(),
      city: Joi.string().required(),
      country: Joi.string().required()
    }).optional(),
    creditLimit: Joi.number().min(0).optional(),
    paymentTerms: Joi.string()
      .valid('COD', 'NET7', 'NET15', 'NET30', 'NET45', 'NET60', 'EOM')
      .optional(),
    discountRate: Joi.number().min(0).max(1).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    notes: Joi.string().max(1000).optional()
  }),

  adjustCredit: Joi.object({
    customerId: Joi.string().uuid().required(),
    adjustmentType: Joi.string()
      .valid('increase', 'decrease', 'set')
      .required(),
    amount: Joi.number().positive().required(),
    isTemporary: Joi.boolean().optional(),
    expiryDate: Joi.when('isTemporary', {
      is: true,
      then: Joi.date().iso().min('now').required(),
      otherwise: Joi.date().optional()
    }),
    reason: Joi.string().required(),
    approvedBy: Joi.string().uuid().optional()
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