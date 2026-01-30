import { Router } from 'express';
import { CheckInController } from '../controllers/check-in.controller';
import { authenticate } from '@/shared/middlewares/authenticate.middleware';
import { authorize } from '@/shared/middlewares/authorize.middleware';
import { Role } from '@prisma/client';

const checkInRouter = Router();
const checkInController = new CheckInController();

/**
 * Todas as rotas requerem autenticação
 */
checkInRouter.use(authenticate);

/**
 * @route POST /api/check-ins
 * @desc Fazer check-in (registrar entrada)
 * @access MEMBER
 */
checkInRouter.post(
  '/',
  authorize([Role.MEMBER]),
  checkInController.create
);

/**
 * @route GET /api/check-ins/can-check-in
 * @desc Verificar se pode fazer check-in hoje
 * @access Private (qualquer usuário autenticado)
 */
checkInRouter.get('/can-check-in', checkInController.canCheckIn);

/**
 * @route GET /api/check-ins/stats
 * @desc Obter estatísticas de check-ins
 * @access INSTRUCTOR, ADMIN
 */
checkInRouter.get(
  '/stats',
  authorize([Role.INSTRUCTOR, Role.ADMIN]),
  checkInController.getStats
);

/**
 * @route GET /api/check-ins/me/history
 * @desc Obter próprio histórico de check-ins
 * @access Private (qualquer usuário autenticado)
 */
checkInRouter.get('/me/history', checkInController.getOwnHistory);

/**
 * @route GET /api/check-ins
 * @desc Listar check-ins (com filtros)
 * @access MEMBER (próprios), INSTRUCTOR/ADMIN (todos)
 */
checkInRouter.get('/', checkInController.list);

/**
 * @route GET /api/check-ins/history/:userId
 * @desc Buscar histórico de check-ins de um usuário
 * @access Próprio usuário ou INSTRUCTOR/ADMIN
 */
checkInRouter.get('/history/:userId', checkInController.getUserHistory);

/**
 * @route PATCH /api/check-ins/:id/validate
 * @desc Validar check-in
 * @access INSTRUCTOR, ADMIN
 */
checkInRouter.patch(
  '/:id/validate',
  authorize([Role.INSTRUCTOR, Role.ADMIN]),
  checkInController.validate
);

export { checkInRouter };