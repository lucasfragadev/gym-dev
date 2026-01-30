import { User, Role, Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
  FindManyUsersFilters,
  PaginatedResult,
} from '../interfaces/user-repository.interface';

export class PrismaUserRepository implements IUserRepository {
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

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

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

  async findByCpf(cpf: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { cpf },
    });
  }

  async findManyByGymId(gymId: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        gymId,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

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
   * Busca paginada com filtros avançados
   */
  async findManyWithFilters(
    filters: FindManyUsersFilters
  ): Promise<PaginatedResult<User>> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Construir condições de filtro
    const where: Prisma.UserWhereInput = {
      gymId: filters.gymId,
    };

    // Filtro por role
    if (filters.role) {
      where.role = filters.role;
    }

    // Filtro por status (ativo/inativo)
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Busca por nome ou email
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Executar queries em paralelo
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          cpf: true,
          phone: true,
          birthDate: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          gymId: true,
          // Não retornar passwordHash
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: data as User[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Reativar usuário
   */
  async reactivate(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        isActive: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

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

  async existsByCpf(cpf: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { cpf },
    });
    return count > 0;
  }

  /**
   * Contar usuários ativos
   */
  async countActiveByGymId(gymId: string): Promise<number> {
    return prisma.user.count({
      where: {
        gymId,
        isActive: true,
      },
    });
  }
}