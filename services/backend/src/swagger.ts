// src/swagger.ts
import { Express } from 'express'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import path from 'path'

/** 1) Define basic info and where to look for JSDoc comments */

const FRONTEND_URL = process.env.FRONTEND_URL;
const SERVER_URL = process.env.SERVER_URL;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My App API',
      version: '1.0.0',
      description: '🚀 Auto-generated Swagger docs via swagger-jsdoc',
    },
    servers: [
      { url: FRONTEND_URL, description: 'Frontend URL' },
      { url: SERVER_URL, description: 'Backend API URL' },
    ],
  },
  // 2) Tell it where your route files live, so it can extract @swagger‐style JSDoc
  apis: [ path.join(__dirname, '/routes/**/*.ts') ],
}

const swaggerSpec = swaggerJsdoc(options)

/**
 * 3) Mount Swagger UI on your Express app
 */
export function setupSwagger(app: Express) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}
