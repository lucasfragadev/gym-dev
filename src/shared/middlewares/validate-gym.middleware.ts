import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors/app-error';

/**
 * Middleware que valida se o usuário está acessando recursos da própria academia
 * Útil para multi-tenancy (garantir isolamento de dados)
 * 
 * @example
 * // Garantir que usuário só acesse membros da própria academia
 * router.get('/members', authenticate, validateGymAccess, getMembers);
 */
export function validateGymAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Pegar gymId do usuário autenticado
    const userGymId = req.gymId;

    // Pegar gymId da requisição (pode vir de params, query ou body)
    const requestGymId =
      req.params.gymId || req.query.gymId || req.body.gymId;

    if (!userGymId) {
      throw new AppError('Dados de academia não encontrados na sessão', 401);
    }

    // Se a rota especifica uma academia, validar se é a mesma do usuário
    if (requestGymId && requestGymId !== userGymId) {
      throw new AppError('Acesso negado a recursos de outra academia', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}