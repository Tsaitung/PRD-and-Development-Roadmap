import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '菜蟲農食 ERP System API',
      version,
      description: 'Comprehensive Enterprise Resource Planning system for agricultural business management',
      contact: {
        name: 'ERP Development Team',
        email: 'dev@tsaitung.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://tsaitung.com/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.tsaitung.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'An error occurred'
                },
                code: {
                  type: 'string',
                  example: 'ERR_001'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object'
                  }
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1
            },
            limit: {
              type: 'integer',
              example: 20
            },
            total: {
              type: 'integer',
              example: 100
            },
            totalPages: {
              type: 'integer',
              example: 5
            }
          }
        },
        Address: {
          type: 'object',
          required: ['addressLine1', 'city', 'country'],
          properties: {
            addressLine1: {
              type: 'string',
              example: '123 Main Street'
            },
            addressLine2: {
              type: 'string',
              example: 'Suite 100'
            },
            city: {
              type: 'string',
              example: 'Taipei'
            },
            state: {
              type: 'string',
              example: 'Taiwan'
            },
            postalCode: {
              type: 'string',
              example: '10001'
            },
            country: {
              type: 'string',
              example: 'Taiwan'
            }
          }
        }
      },
      parameters: {
        pageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1
          },
          description: 'Page number for pagination'
        },
        limitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 20
          },
          description: 'Number of items per page'
        },
        sortParam: {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string'
          },
          description: 'Field to sort by'
        },
        orderParam: {
          in: 'query',
          name: 'sortOrder',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc'
          },
          description: 'Sort order'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Warehouse',
        description: 'Warehouse and inventory management'
      },
      {
        name: 'Production',
        description: 'Manufacturing execution system'
      },
      {
        name: 'Orders',
        description: 'Order management and processing'
      },
      {
        name: 'Customers',
        description: 'Customer relationship management'
      },
      {
        name: 'Purchasing',
        description: 'Procurement and supplier management'
      },
      {
        name: 'Finance',
        description: 'Financial and accounting operations'
      }
    ]
  },
  apis: [
    './src/modules/**/routes.ts',
    './src/modules/**/controller.ts',
    './src/routes/*.ts'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);