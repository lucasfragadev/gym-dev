import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '@/shared/errors/app-error';

/**
 * Middleware de autorização baseado em roles (RBAC)
 * 
 * @param allowedRoles - Array de roles permitidas para acessar a rota
 * 
 * @example
 * // Apenas ADMINs podem acessar
 * router.delete('/users/:id', authenticate, authorize(['ADMIN']), deleteUser);
 * 
 * @example
 * // ADMINs e INSTRUCTORs podem acessar
 * router.post('/workouts', authenticate, authorize(['ADMIN', 'INSTRUCTOR']), createWorkout);
 */
export function authorize(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 1. Verificar se usuário está autenticado
      if (!req.userRole) {
        throw new AppError('Usuário não autenticado', 401);
      }

      // 2. Verificar se role do usuário está na lista de permitidos
      const userRole = req.userRole as Role;

      if (!allowedRoles.includes(userRole)) {
        throw new AppError(
          `Acesso negado. Permissões necessárias: ${allowedRoles.join(', ')}`,
          403
        );
      }

      // 3. Continuar
      next();
    } catch (error) {
      next(error);
    }
  };
}