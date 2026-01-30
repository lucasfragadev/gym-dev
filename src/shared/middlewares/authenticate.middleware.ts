import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/shared/utils/jwt.util';
import { AppError } from '@/shared/errors/app-error';

/**
 * Extensão do tipo Request para incluir dados do usuário autenticado
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      gymId?: string;
      userRole?: string;
    }
  }
}

/**
 * Middleware de autenticação
 * Valida o JWT e injeta dados do usuário na requisição
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // 1. Pegar token do cookie OU header Authorization
    const tokenFromCookie = req.cookies.accessToken;
    const tokenFromHeader = req.headers.authorization?.replace('Bearer ', '');

    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      throw new AppError('Token de autenticação não fornecido', 401);
    }

    // 2. Validar e decodificar token
    const decoded = verifyAccessToken(token);

    // 3. Injetar dados na requisição
    req.userId = decoded.userId;
    req.gymId = decoded.gymId;
    req.userRole = decoded.role;

    // 4. Continuar para próximo middleware/controller
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Token inválido ou expirado', 401));
    }
  }
}