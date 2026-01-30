import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { PrismaUserRepository } from '@/modules/users/repositories/prisma-user.repository';
import { registerSchema, loginSchema, refreshTokenSchema } from '../dtos/auth.dto';
import { cookieConfig } from '@/config/cookies';

export class AuthController {
  private authService: AuthService;

  constructor() {
    const userRepository = new PrismaUserRepository();
    this.authService = new AuthService(userRepository);
  }

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await this.authService.register(data);

      // Access Token: 15 minutos
      res.cookie('accessToken', result.accessToken, {
        ...cookieConfig,
        maxAge: 15 * 60 * 1000, // ← Sobrescreve o padrão
      });

      // Refresh Token: 7 dias (usa o padrão do cookieConfig)
      res.cookie('refreshToken', result.refreshToken, cookieConfig);

      res.status(201).json({
        status: 'success',
        message: 'Usuário registrado com sucesso',
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = loginSchema.parse(req.body);
      const result = await this.authService.login(data);

      // Access Token: 15 minutos
      res.cookie('accessToken', result.accessToken, {
        ...cookieConfig,
        maxAge: 15 * 60 * 1000,
      });

      // Refresh Token: 7 dias
      res.cookie('refreshToken', result.refreshToken, cookieConfig);

      res.status(200).json({
        status: 'success',
        message: 'Login realizado com sucesso',
        data: {
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          status: 'error',
          message: 'Refresh token não fornecido',
        });
        return;
      }

      refreshTokenSchema.parse({ refreshToken });
      const result = await this.authService.refreshAccessToken(refreshToken);

      // Atualizar apenas o Access Token
      res.cookie('accessToken', result.accessToken, {
        ...cookieConfig,
        maxAge: 15 * 60 * 1000,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token renovado com sucesso',
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(200).json({
        status: 'success',
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'Não autenticado',
        });
        return;
      }

      const user = await this.authService.getProfile(userId);

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };
}