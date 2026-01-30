import { User, Role } from '@prisma/client';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { AppError } from '@/shared/errors/app-error';
import {
  UpdateProfileDTO,
  UpdateUserDTO,
  ListUsersFiltersDTO,
} from '../dtos/user.dto';

/**
 * Dados do usuário sem senha (para retorno seguro)
 */
export type SafeUser = Omit<User, 'passwordHash'>;

/**
 * Service de Usuários
 * Contém lógica de negócio e regras de permissão
 */
export class UserService {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Listar usuários com filtros e paginação
   * Permissões: ADMIN (todos), INSTRUCTOR (mesmo gym)
   */
  async listUsers(
    filters: ListUsersFiltersDTO,
    requestingUserId: string,
    requestingUserRole: Role,
    requestingUserGymId: string
  ) {
    // Validar permissão
    if (requestingUserRole === Role.MEMBER) {
      throw new AppError('Sem permissão para listar usuários', 403);
    }

    // Forçar filtro por academia do usuário logado
    const result = await this.userRepository.findManyWithFilters({
      ...filters,
      gymId: requestingUserGymId,
    });

    // Remover senhas dos resultados
    const safeData = result.data.map(user => this.removeSensitiveData(user));

    return {
      data: safeData,
      meta: result.meta,
    };
  }

  /**
   * Buscar usuário por ID
   * Permissões: Próprio perfil, ou INSTRUCTOR/ADMIN do mesmo gym
   */
  async getUserById(
    userId: string,
    requestingUserId: string,
    requestingUserRole: Role,
    requestingUserGymId: string
  ): Promise<SafeUser> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Validar permissão
    const isSelf = userId === requestingUserId;
    const isSameGym = user.gymId === requestingUserGymId;
    const hasPermission =
      isSelf ||
      (isSameGym && requestingUserRole !== Role.MEMBER);

    if (!hasPermission) {
      throw new AppError('Sem permissão para visualizar este usuário', 403);
    }

    return this.removeSensitiveData(user);
  }

  /**
   * Atualizar próprio perfil
   * Permissões: Qualquer usuário autenticado pode atualizar o próprio perfil
   */
  async updateOwnProfile(
    userId: string,
    data: UpdateProfileDTO
  ): Promise<SafeUser> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (!user.isActive) {
      throw new AppError('Usuário inativo', 403);
    }

    // Atualizar apenas campos permitidos para o próprio usuário
    const updatedUser = await this.userRepository.update(userId, {
      name: data.name,
      phone: data.phone,
      birthDate: data.birthDate,
      avatarUrl: data.avatarUrl,
    });

    return this.removeSensitiveData(updatedUser);
  }

  /**
   * Atualizar qualquer usuário (admin apenas)
   * Permissões: Apenas ADMIN
   */
  async updateUser(
    userId: string,
    data: UpdateUserDTO,
    requestingUserId: string,
    requestingUserRole: Role,
    requestingUserGymId: string
  ): Promise<SafeUser> {
    // Apenas ADMINs podem usar este método
    if (requestingUserRole !== Role.ADMIN) {
      throw new AppError('Sem permissão para editar usuários', 403);
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Validar se é da mesma academia
    if (user.gymId !== requestingUserGymId) {
      throw new AppError('Não é possível editar usuários de outra academia', 403);
    }

    // Validar email único (se estiver alterando)
    if (data.email && data.email !== user.email) {
      const emailExists = await this.userRepository.existsByEmailAndGymId(
        data.email,
        user.gymId
      );
      if (emailExists) {
        throw new AppError('E-mail já cadastrado', 409);
      }
    }

    // Validar CPF único (se estiver alterando)
    if (data.cpf && data.cpf !== user.cpf) {
      const cpfExists = await this.userRepository.existsByCpf(data.cpf);
      if (cpfExists) {
        throw new AppError('CPF já cadastrado', 409);
      }
    }

    // Atualizar
    const updatedUser = await this.userRepository.update(userId, data);

    return this.removeSensitiveData(updatedUser);
  }

  /**
   * Desativar usuário (soft delete)
   * Permissões: Apenas ADMIN
   */
  async deactivateUser(
    userId: string,
    requestingUserId: string,
    requestingUserRole: Role,
    requestingUserGymId: string
  ): Promise<SafeUser> {
    if (requestingUserRole !== Role.ADMIN) {
      throw new AppError('Sem permissão para desativar usuários', 403);
    }

    // Não pode desativar a si mesmo
    if (userId === requestingUserId) {
      throw new AppError('Não é possível desativar o próprio usuário', 400);
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (user.gymId !== requestingUserGymId) {
      throw new AppError('Não é possível desativar usuários de outra academia', 403);
    }

    if (!user.isActive) {
      throw new AppError('Usuário já está inativo', 400);
    }

    const deactivatedUser = await this.userRepository.softDelete(userId);

    return this.removeSensitiveData(deactivatedUser);
  }

  /**
   * Reativar usuário
   * Permissões: Apenas ADMIN
   */
  async reactivateUser(
    userId: string,
    requestingUserId: string,
    requestingUserRole: Role,
    requestingUserGymId: string
  ): Promise<SafeUser> {
    if (requestingUserRole !== Role.ADMIN) {
      throw new AppError('Sem permissão para reativar usuários', 403);
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (user.gymId !== requestingUserGymId) {
      throw new AppError('Não é possível reativar usuários de outra academia', 403);
    }

    if (user.isActive) {
      throw new AppError('Usuário já está ativo', 400);
    }

    const reactivatedUser = await this.userRepository.reactivate(userId);

    return this.removeSensitiveData(reactivatedUser);
  }

  /**
   * Deletar usuário permanentemente (hard delete)
   * Permissões: Apenas ADMIN
   * ⚠️ Usar com extremo cuidado!
   */
  async deleteUser(
    userId: string,
    requestingUserId: string,
    requestingUserRole: Role,
    requestingUserGymId: string
  ): Promise<void> {
    if (requestingUserRole !== Role.ADMIN) {
      throw new AppError('Sem permissão para deletar usuários', 403);
    }

    // Não pode deletar a si mesmo
    if (userId === requestingUserId) {
      throw new AppError('Não é possível deletar o próprio usuário', 400);
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (user.gymId !== requestingUserGymId) {
      throw new AppError('Não é possível deletar usuários de outra academia', 403);
    }

    await this.userRepository.delete(userId);
  }

  /**
   * Buscar estatísticas de usuários da academia
   * Permissões: INSTRUCTOR e ADMIN
   */
  async getGymStats(
    requestingUserRole: Role,
    requestingUserGymId: string
  ) {
    if (requestingUserRole === Role.MEMBER) {
      throw new AppError('Sem permissão para visualizar estatísticas', 403);
    }

    const [totalActive, totalMembers, totalInstructors, totalAdmins] =
      await Promise.all([
        this.userRepository.countActiveByGymId(requestingUserGymId),
        this.userRepository
          .findManyByRoleAndGymId(Role.MEMBER, requestingUserGymId)
          .then(users => users.length),
        this.userRepository
          .findManyByRoleAndGymId(Role.INSTRUCTOR, requestingUserGymId)
          .then(users => users.length),
        this.userRepository
          .findManyByRoleAndGymId(Role.ADMIN, requestingUserGymId)
          .then(users => users.length),
      ]);

    return {
      totalActive,
      byRole: {
        members: totalMembers,
        instructors: totalInstructors,
        admins: totalAdmins,
      },
    };
  }

  /**
   * Remove dados sensíveis do usuário
   */
  private removeSensitiveData(user: User): SafeUser {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}