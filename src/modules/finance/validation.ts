import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const schemas = {
  createInvoice: Joi.object({
    invoiceType: Joi.string()
      .valid('sales', 'purchase')
      .required(),
    customerId: Joi.when('invoiceType', {
      is: 'sales',
      then: Joi.string().uuid().required(),
      otherwise: Joi.string().uuid().optional()
    }),
    supplierId: Joi.when('invoiceType', {
      is: 'purchase',
      then: Joi.string().uuid().required(),
      otherwise: Joi.string().uuid().optional()
    }),
    orderId: Joi.string().uuid().optional(),
    invoiceDate: Joi.date().iso().required(),
    dueDate: Joi.date().iso().min(Joi.ref('invoiceDate')).required(),
    items: Joi.array().min(1).items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        description: Joi.string().required(),
        quantity: Joi.number().positive().required(),
        unitPrice: Joi.number().positive().required(),
        discountRate: Joi.number().min(0).max(100).optional(),
        taxRate: Joi.number().min(0).max(100).optional(),
        accountCode: Joi.string().optional()
      })
    ).required(),
    paymentTerms: Joi.string().required(),
    notes: Joi.string().max(1000).optional(),
    attachments: Joi.array().items(Joi.string()).optional()
  }),

  processPayment: Joi.object({
    invoiceId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string()
      .valid('cash', 'bank_transfer', 'credit_card', 'check', 'e_wallet')
      .required(),
    paymentDate: Joi.date().iso().required(),
    bankAccount: Joi.string().optional(),
    transactionId: Joi.string().optional(),
    notes: Joi.string().max(500).optional()
  }),

  calculateTax: Joi.object({
    items: Joi.array().min(1).items(
      Joi.object({
        amount: Joi.number().positive().required(),
        taxCode: Joi.string().required(),
        quantity: Joi.number().positive().optional()
      })
    ).required(),
    isInclusive: Joi.boolean().optional()
  })
};

export const validateRequest = (schemaName: keyof typeof schemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'Invalid validation schema'
        }
      });
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