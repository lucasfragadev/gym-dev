import { User, Role } from '@prisma/client';

/**
 * DTO para criação de usuário (usado internamente pelo repository)
 */
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

/**
 * DTO para atualização de usuário
 */
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
 * Interface do Repository de Usuários
 * Define o contrato que qualquer implementação deve seguir
 */
export interface IUserRepository {
  /**
   * Cria um novo usuário
   */
  create(data: CreateUserData): Promise<User>;

  /**
   * Busca usuário por ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Busca usuário por email e academia
   * (email é único por academia, não globalmente)
   */
  findByEmailAndGymId(email: string, gymId: string): Promise<User | null>;

  /**
   * Busca usuário por CPF
   */
  findByCpf(cpf: string): Promise<User | null>;

  /**
   * Lista todos os usuários de uma academia
   */
  findManyByGymId(gymId: string): Promise<User[]>;

  /**
   * Lista usuários por role em uma academia
   */
  findManyByRoleAndGymId(role: Role, gymId: string): Promise<User[]>;

  /**
   * Atualiza um usuário
   */
  update(id: string, data: UpdateUserData): Promise<User>;

  /**
   * Soft delete (marca como inativo)
   */
  softDelete(id: string): Promise<User>;

  /**
   * Hard delete (remove permanentemente - use com cuidado!)
   */
  delete(id: string): Promise<void>;

  /**
   * Verifica se email já existe em uma academia
   */
  existsByEmailAndGymId(email: string, gymId: string): Promise<boolean>;

  /**
   * Verifica se CPF já existe
   */
  existsByCpf(cpf: string): Promise<boolean>;
}