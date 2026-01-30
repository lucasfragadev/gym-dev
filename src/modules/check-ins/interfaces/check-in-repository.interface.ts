import { CheckIn } from '@prisma/client';

/**
 * DTO para criar check-in
 */
export interface CreateCheckInData {
  userId: string;
  gymId: string;
}

/**
 * Filtros para buscar check-ins
 */
export interface FindCheckInsFilters {
  gymId: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  validated?: boolean; // null = todos, true = validados, false = pendentes
  page?: number;
  limit?: number;
}

/**
 * Resultado paginado
 */
export interface PaginatedCheckIns {
  data: CheckIn[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Estatísticas de check-ins
 */
export interface CheckInStats {
  totalToday: number;
  totalWeek: number;
  totalMonth: number;
  averagePerDay: number;
  mostActiveUsers: {
    userId: string;
    userName: string;
    count: number;
  }[];
}

/**
 * Interface do Repository de Check-ins
 */
export interface ICheckInRepository {
  /**
   * Criar check-in
   */
  create(data: CreateCheckInData): Promise<CheckIn>;

  /**
   * Buscar check-in por ID
   */
  findById(id: string): Promise<CheckIn | null>;

  /**
   * Buscar último check-in do usuário na academia
   */
  findLastByUserAndGym(userId: string, gymId: string): Promise<CheckIn | null>;

  /**
   * Verificar se usuário já fez check-in hoje
   */
  hasCheckedInToday(userId: string, gymId: string): Promise<boolean>;

  /**
   * Buscar check-ins com filtros
   */
  findManyWithFilters(filters: FindCheckInsFilters): Promise<PaginatedCheckIns>;

  /**
   * Buscar check-ins do usuário
   */
  findByUser(userId: string, limit?: number): Promise<CheckIn[]>;

  /**
   * Validar check-in (marcar como validado)
   */
  validate(id: string): Promise<CheckIn>;

  /**
   * Contar check-ins de hoje
   */
  countToday(gymId: string): Promise<number>;

  /**
   * Contar check-ins da semana
   */
  countThisWeek(gymId: string): Promise<number>;

  /**
   * Contar check-ins do mês
   */
  countThisMonth(gymId: string): Promise<number>;

  /**
   * Obter estatísticas gerais
   */
  getStats(gymId: string): Promise<CheckInStats>;
}