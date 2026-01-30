import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { PrismaUserRepository } from '../repositories/prisma-user.repository';
import {
  updateProfileSchema,
  updateUserSchema,
  listUsersFiltersSchema,
} from '../dtos/user.dto';
import { Role } from '@prisma/client';

/**
 * Controller de Usuários
 * Gerencia requisições HTTP relacionadas a usuários
 */
export class UserController {
  private userService: UserService;

  constructor() {
    const userRepository = new PrismaUserRepository();
    this.userService = new UserService(userRepository);
  }

  /**
   * GET /api/users
   * Lista usuários com filtros e paginação
   * Permissões: INSTRUCTOR, ADMIN
   */
  listUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validar query params
      const filters = listUsersFiltersSchema.parse(req.query);

      // Dados do usuário autenticado (vêm do middleware)
      const userId = req.userId!;
      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      const result = await this.userService.listUsers(
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
   * GET /api/users/:id
   * Busca usuário por ID
   * Permissões: Próprio perfil, ou INSTRUCTOR/ADMIN do mesmo gym
   */
  getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const userId = req.userId!;
      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      const user = await this.userService.getUserById(
        id,
        userId,
        userRole,
        gymId
      );

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users/me
   * Retorna dados do próprio usuário (atalho para /api/auth/me)
   * Permissões: Qualquer usuário autenticado
   */
  getOwnProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      const user = await this.userService.getUserById(
        userId,
        userId,
        userRole,
        gymId
      );

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/users/me
   * Atualiza próprio perfil
   * Permissões: Qualquer usuário autenticado
   */
  updateOwnProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const userId = req.userId!;

      const user = await this.userService.updateOwnProfile(userId, data);

      res.status(200).json({
        status: 'success',
        message: 'Perfil atualizado com sucesso',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/users/:id
   * Atualiza qualquer usuário (admin apenas)
   * Permissões: ADMIN
   */
  updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const data = updateUserSchema.parse(req.body);

      const userId = req.userId!;
      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      const user = await this.userService.updateUser(
        id,
        data,
        userId,
        userRole,
        gymId
      );

      res.status(200).json({
        status: 'success',
        message: 'Usuário atualizado com sucesso',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/users/:id/deactivate
   * Desativa usuário (soft delete)
   * Permissões: ADMIN
   */
  deactivateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const userId = req.userId!;
      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      const user = await this.userService.deactivateUser(
        id,
        userId,
        userRole,
        gymId
      );

      res.status(200).json({
        status: 'success',
        message: 'Usuário desativado com sucesso',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/users/:id/reactivate
   * Reativa usuário desativado
   * Permissões: ADMIN
   */
  reactivateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const userId = req.userId!;
      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      const user = await this.userService.reactivateUser(
        id,
        userId,
        userRole,
        gymId
      );

      res.status(200).json({
        status: 'success',
        message: 'Usuário reativado com sucesso',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/users/:id
   * Deleta usuário permanentemente (hard delete)
   * Permissões: ADMIN
   * ⚠️ Usar com extremo cuidado!
   */
  deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const userId = req.userId!;
      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      await this.userService.deleteUser(id, userId, userRole, gymId);

      res.status(200).json({
        status: 'success',
        message: 'Usuário deletado permanentemente',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users/stats
   * Retorna estatísticas de usuários da academia
   * Permissões: INSTRUCTOR, ADMIN
   */
  getGymStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userRole = req.userRole as Role;
      const gymId = req.gymId!;

      const stats = await this.userService.getGymStats(userRole, gymId);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}