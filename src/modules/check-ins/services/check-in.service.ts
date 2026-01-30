import { CheckIn, Role } from '@prisma/client';
import { ICheckInRepository } from '../interfaces/check-in-repository.interface';
import { IUserRepository } from '@/modules/users/interfaces/user-repository.interface';
import { AppError } from '@/shared/errors/app-error';
import { ListCheckInsFiltersDTO } from '../dtos/check-in.dto';

/**
 * Service de Check-ins
 * Contém lógica de negócio relacionada a check-ins
 */
export class CheckInService {
  constructor(
    private checkInRepository: ICheckInRepository,
    private userRepository: IUserRepository
  ) {}

  /**
   * Criar check-in (entrada na academia)
   * Permissões: Apenas MEMBER
   */
  async create(
    userId: string,
    gymId: string,
    userRole: Role
  ): Promise<CheckIn> {
    // 1. Validar que é um MEMBER
    if (userRole !== Role.MEMBER) {
      throw new AppError(
        'Apenas membros podem fazer check-in',
        403
      );
    }

    // 2. Validar que usuário existe e está ativo
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (!user.isActive) {
      throw new AppError('Usuário inativo não pode fazer check-in', 403);
    }

    // 3. Validar que não fez check-in hoje
    const hasCheckedInToday = await this.checkInRepository.hasCheckedInToday(
      userId,
      gymId
    );

    if (hasCheckedInToday) {
      throw new AppError('Você já fez check-in hoje', 409);
    }

    // 4. Validar plano ativo (simplificado - verificar última subscription)
    // TODO: Quando implementar assinaturas, validar se tem plano ativo
    const subscriptions = await this.userRepository.findById(userId);
    // Por enquanto, permitir sempre (quando tiver subscription, adicionar validação)

    // 5. Criar check-in
    const checkIn = await this.checkInRepository.create({
      userId,
      gymId,
    });

    return checkIn;
  }

  /**
   * Listar check-ins com filtros
   * Permissões: INSTRUCTOR/ADMIN (todos), MEMBER (apenas próprios)
   */
  async list(
    filters: ListCheckInsFiltersDTO,
    requestingUserId: string,
    requestingUserRole: Role,
    requestingUserGymId: string
  ) {
    // MEMBERs só podem ver próprios check-ins
    if (requestingUserRole === Role.MEMBER) {
      filters.userId = requestingUserId;
    }

    // Forçar filtro por academia
    const result = await this.checkInRepository.findManyWithFilters({
      ...filters,
      gymId: requestingUserGymId,
    });

    return result;
  }

  /**
   * Buscar histórico de check-ins do usuário
   * Permissões: Próprio usuário ou INSTRUCTOR/ADMIN
   */
  async getUserHistory(
    userId: string,
    requestingUserId: string,
    requestingUserRole: Role,
    requestingUserGymId: string,
    limit = 10
  ): Promise<CheckIn[]> {
    // Validar permissão
    const isSelf = userId === requestingUserId;
    const hasPermission =
      isSelf || requestingUserRole !== Role.MEMBER;

    if (!hasPermission) {
      throw new AppError('Sem permissão para visualizar histórico', 403);
    }

    // Validar que usuário é da mesma academia
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (user.gymId !== requestingUserGymId) {
      throw new AppError('Usuário de outra academia', 403);
    }

    return this.checkInRepository.findByUser(userId, limit);
  }

  /**
   * Validar check-in (marcar presença confirmada)
   * Permissões: INSTRUCTOR, ADMIN
   */
  async validate(
    checkInId: string,
    requestingUserRole: Role,
    requestingUserGymId: string
  ): Promise<CheckIn> {
    // Apenas INSTRUCTOR e ADMIN podem validar
    if (requestingUserRole === Role.MEMBER) {
      throw new AppError('Sem permissão para validar check-ins', 403);
    }

    const checkIn = await this.checkInRepository.findById(checkInId);

    if (!checkIn) {
      throw new AppError('Check-in não encontrado', 404);
    }

    // Validar que é da mesma academia
    if (checkIn.gymId !== requestingUserGymId) {
      throw new AppError('Check-in de outra academia', 403);
    }

    // Validar que não foi validado ainda
    if (checkIn.validatedAt) {
      throw new AppError('Check-in já foi validado', 400);
    }

    return this.checkInRepository.validate(checkInId);
  }

  /**
   * Obter estatísticas de check-ins da academia
   * Permissões: INSTRUCTOR, ADMIN
   */
  async getStats(
    requestingUserRole: Role,
    requestingUserGymId: string
  ) {
    if (requestingUserRole === Role.MEMBER) {
      throw new AppError('Sem permissão para visualizar estatísticas', 403);
    }

    return this.checkInRepository.getStats(requestingUserGymId);
  }

  /**
   * Verificar se usuário pode fazer check-in hoje
   * Útil para o frontend validar antes de enviar
   */
  async canCheckInToday(
    userId: string,
    gymId: string
  ): Promise<{ canCheckIn: boolean; reason?: string }> {
    // Verificar se usuário está ativo
    const user = await this.userRepository.findById(userId);

    if (!user || !user.isActive) {
      return {
        canCheckIn: false,
        reason: 'Usuário inativo',
      };
    }

    // Verificar se já fez check-in hoje
    const hasCheckedIn = await this.checkInRepository.hasCheckedInToday(
      userId,
      gymId
    );

    if (hasCheckedIn) {
      return {
        canCheckIn: false,
        reason: 'Você já fez check-in hoje',
      };
    }

    // TODO: Validar assinatura ativa quando implementado

    return {
      canCheckIn: true,
    };
  }
}