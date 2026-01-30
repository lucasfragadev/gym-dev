import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '@/shared/middlewares/authenticate.middleware';
import { authorize } from '@/shared/middlewares/authorize.middleware';
import { Role } from '@prisma/client';

const userRouter = Router();
const userController = new UserController();

/**
 * Todas as rotas requerem autenticação
 */
userRouter.use(authenticate);

/**
 * @route GET /api/users/stats
 * @desc Estatísticas de usuários da academia
 * @access INSTRUCTOR, ADMIN
 */
userRouter.get(
  '/stats',
  authorize([Role.INSTRUCTOR, Role.ADMIN]),
  userController.getGymStats
);

/**
 * @route GET /api/users/me
 * @desc Obter próprio perfil
 * @access Private (qualquer usuário autenticado)
 */
userRouter.get('/me', userController.getOwnProfile);

/**
 * @route PATCH /api/users/me
 * @desc Atualizar próprio perfil
 * @access Private (qualquer usuário autenticado)
 */
userRouter.patch('/me', userController.updateOwnProfile);

/**
 * @route GET /api/users
 * @desc Listar usuários (com filtros e paginação)
 * @access INSTRUCTOR, ADMIN
 */
userRouter.get(
  '/',
  authorize([Role.INSTRUCTOR, Role.ADMIN]),
  userController.listUsers
);

/**
 * @route GET /api/users/:id
 * @desc Buscar usuário por ID
 * @access Private (próprio perfil ou INSTRUCTOR/ADMIN do mesmo gym)
 */
userRouter.get('/:id', userController.getUserById);

/**
 * @route PATCH /api/users/:id
 * @desc Atualizar usuário
 * @access ADMIN
 */
userRouter.patch(
  '/:id',
  authorize([Role.ADMIN]),
  userController.updateUser
);

/**
 * @route POST /api/users/:id/deactivate
 * @desc Desativar usuário (soft delete)
 * @access ADMIN
 */
userRouter.post(
  '/:id/deactivate',
  authorize([Role.ADMIN]),
  userController.deactivateUser
);

/**
 * @route POST /api/users/:id/reactivate
 * @desc Reativar usuário
 * @access ADMIN
 */
userRouter.post(
  '/:id/reactivate',
  authorize([Role.ADMIN]),
  userController.reactivateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc Deletar usuário permanentemente
 * @access ADMIN
 * @warning Usar com extremo cuidado!
 */
userRouter.delete(
  '/:id',
  authorize([Role.ADMIN]),
  userController.deleteUser
);

export { userRouter };