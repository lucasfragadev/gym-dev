import { User, Role } from '@prisma/client';
import { prisma } from '@/config/database';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
} from '../interfaces/user-repository.interface';

/**
 * Implementação do Repository de Usuários usando Prisma ORM
 */
export class PrismaUserRepository implements IUserRepository {
  /**
   * Cria um novo usuário no banco de dados
   */
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data: {
        gymId: data.gymId,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        cpf: data.cpf,
        phone: data.phone,
        birthDate: data.birthDate,
      },
    });
  }

  /**
   * Busca um usuário por ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Busca um usuário por email dentro de uma academia específica
   * (email é único por academia, não globalmente)
   */
  async findByEmailAndGymId(
    email: string,
    gymId: string
  ): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email_gymId: {
          email,
          gymId,
        },
      },
    });
  }

  /**
   * Busca um usuário por CPF
   */
  async findByCpf(cpf: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { cpf },
    });
  }

  /**
   * Lista todos os usuários de uma academia
   */
  async findManyByGymId(gymId: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        gymId,
        isActive: true, // Apenas usuários ativos
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Lista usuários por role em uma academia
   */
  async findManyByRoleAndGymId(role: Role, gymId: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        gymId,
        role,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Atualiza dados de um usuário
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete: marca o usuário como inativo
   * (preferível ao delete permanente para manter histórico)
   */
  async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Hard delete: remove permanentemente do banco
   * ⚠️ Use com cuidado! Preferir softDelete
   */
  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Verifica se já existe um usuário com o email em uma academia
   */
  async existsByEmailAndGymId(
    email: string,
    gymId: string
  ): Promise<boolean> {
    const count = await prisma.user.count({
      where: {
        email,
        gymId,
      },
    });
    return count > 0;
  }

  /**
   * Verifica se já existe um usuário com o CPF
   */
  async existsByCpf(cpf: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { cpf },
    });
    return count > 0;
  }
}