import { Router } from 'express';
import routes from '../controllers/authController';

const router = Router();

// POST /auth/login
/**
 * @swagger
 * /auth/login:
 *   post:
 *    summary: Login user
 *   description: Authenticate user and return JWT token
 *  tags:
 *   - Auth
 * parameters:
 *  - in: body
 *   name: body
 *  description: User credentials
 * required: true
 * schema:
 *   type: object
 *   properties:
 *    email:
 *     type: string
 *    format: email
 *    password:
 *     type: string
 * required: true
 * responses:
 *  '200':
 * description: Successful login
 *  content:
 *   application/json:
 * schema:
 *    type: object
 *    properties:
 *     token:
 *      type: string
 * 
 */
router.post('/login', routes.login);

// POST /auth/forgot-password
router.post('/forgot-password', routes.forgotPassword);

// POST /auth/reset-password
router.post('/reset-password', routes.resetPassword);

// POST /auth/set-password
router.post('/set-password', routes.setPassword);


export default router;
