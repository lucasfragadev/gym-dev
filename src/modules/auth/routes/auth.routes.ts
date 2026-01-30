import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '@/shared/middlewares/authenticate.middleware';

const authRouter = Router();
const authController = new AuthController();

/**
 * Rotas públicas
 */
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);

/**
 * Rotas protegidas
 */
authRouter.get('/me', authenticate, authController.getProfile); // ← Protegida agora

export { authRouter };