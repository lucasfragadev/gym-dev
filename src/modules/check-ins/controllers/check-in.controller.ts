import { Request, Response, NextFunction } from 'express';
import { CheckInService } from '../services/check-in.service';
import { PrismaCheckInRepository } from '../repositories/prisma-check-in.repository';
import { PrismaUserRepository } from '@/modules/users/repositories/prisma-user.repository';
import { listCheckInsFiltersSchema } from '../dtos/check-in.dto';
import { Role } from '@prisma/client';

/**
 * Controller de Check-ins
 * Gerencia requisições HTTP relacionadas a check-ins
 */
export class CheckInController {
  private checkInService: CheckInService;

  constructor() {
    const checkInRepository = new PrismaCheckInRepository();
    const userRepository = new PrismaUserRepository();
    this.checkInService = new CheckInService(checkInRepository, userRepository);
  }

  /**
   * POST /api/check-ins
   * Criar check-in (registrar entrada)
   * Permissões: MEMBER
   */
  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const gymId = req.gymId!;
      const userRole = req.userRole as Role;

      const checkIn = await this.checkInService.create(userId, gymId, userRole);

      res.status(201).json({
        status: 'success',
        message: 'Check-in realizado com sucesso',
        data: { checkIn },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/check-ins
   * Listar check-ins (com filtros)
   * Permissões: MEMBER (próprios), INSTRUCTOR/ADMIN (todos)
   */
  list = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const filters = listCheckInsFiltersSchema.parse(req.query);

      const userId = req.userId!;
      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      const result = await this.checkInService.list(
        filters,
        userId,
        userRole,
        gymId
      );

      res.status(200).json({
        status: 'success',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/check-ins/history/:userId
   * Buscar histórico de check-ins de um usuário
   * Permissões: Próprio usuário ou INSTRUCTOR/ADMIN
   */
  getUserHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const requestingUserId = req.userId!;
      const requestingUserRole = req.userRole as Role;
      const requestingUserGymId = req.gymId!;

      const history = await this.checkInService.getUserHistory(
        userId,
        requestingUserId,
        requestingUserRole,
        requestingUserGymId,
        limit
      );

      res.status(200).json({
        status: 'success',
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/check-ins/me/history
   * Buscar próprio histórico de check-ins
   * Permissões: Qualquer usuário autenticado
   */
  getOwnHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const history = await this.checkInRepository.findByUser(userId, limit);

      res.status(200).json({
        status: 'success',
        data: { history },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/check-ins/:id/validate
   * Validar check-in
   * Permissões: INSTRUCTOR, ADMIN
   */
  validate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      const checkIn = await this.checkInService.validate(id, userRole, gymId);

      res.status(200).json({
        status: 'success',
        message: 'Check-in validado com sucesso',
        data: { checkIn },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/check-ins/stats
   * Obter estatísticas de check-ins
   * Permissões: INSTRUCTOR, ADMIN
   */
  getStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      const stats = await this.checkInService.getStats(userRole, gymId);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/check-ins/can-check-in
   * Verificar se pode fazer check-in hoje
   * Permissões: Qualquer usuário autenticado
   */
  canCheckIn = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const gymId = req.gymId!;

      const result = await this.checkInService.canCheckInToday(userId, gymId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // Propriedade para acessar repository diretamente (usado em getOwnHistory)
  private checkInRepository = new PrismaCheckInRepository();
}