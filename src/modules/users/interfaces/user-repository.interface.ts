import { User, Role } from '@prisma/client';

export interface CreateUserData {
  gymId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  cpf?: string;
  phone?: string;
  birthDate?: Date;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  passwordHash?: string;
  role?: Role;
  cpf?: string;
  phone?: string;
  birthDate?: Date;
  avatarUrl?: string;
  isActive?: boolean;
}

/**
 * Filtros para listagem de usuários
 */
export interface FindManyUsersFilters {
  gymId: string;
  role?: Role;
  isActive?: boolean;
  search?: string; // Busca por nome ou email
  page?: number;
  limit?: number;
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmailAndGymId(email: string, gymId: string): Promise<User | null>;
  findByCpf(cpf: string): Promise<User | null>;
  findManyByGymId(gymId: string): Promise<User[]>;
  findManyByRoleAndGymId(role: Role, gymId: string): Promise<User[]>;
  
  /**
   * Busca paginada com filtros
   */
  findManyWithFilters(filters: FindManyUsersFilters): Promise<PaginatedResult<User>>;
  
  update(id: string, data: UpdateUserData): Promise<User>;
  softDelete(id: string): Promise<User>;
  
  /**
   * Reativar usuário desativado
   */
  reactivate(id: string): Promise<User>;
  
  delete(id: string): Promise<void>;
  existsByEmailAndGymId(email: string, gymId: string): Promise<boolean>;
  existsByCpf(cpf: string): Promise<boolean>;
  
  /**
   * Contar usuários ativos por academia
   */
  countActiveByGymId(gymId: string): Promise<number>;
}