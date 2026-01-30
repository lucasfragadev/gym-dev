import { CheckIn, Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import {
  ICheckInRepository,
  CreateCheckInData,
  FindCheckInsFilters,
  PaginatedCheckIns,
  CheckInStats,
} from '../interfaces/check-in-repository.interface';

export class PrismaCheckInRepository implements ICheckInRepository {
  async create(data: CreateCheckInData): Promise<CheckIn> {
    return prisma.checkIn.create({
      data: {
        userId: data.userId,
        gymId: data.gymId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<CheckIn | null> {
    return prisma.checkIn.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findLastByUserAndGym(
    userId: string,
    gymId: string
  ): Promise<CheckIn | null> {
    return prisma.checkIn.findFirst({
      where: {
        userId,
        gymId,
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    });
  }

  async hasCheckedInToday(userId: string, gymId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await prisma.checkIn.count({
      where: {
        userId,
        gymId,
        checkedInAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return count > 0;
  }

  async findManyWithFilters(
    filters: FindCheckInsFilters
  ): Promise<PaginatedCheckIns> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CheckInWhereInput = {
      gymId: filters.gymId,
    };

    // Filtro por usuário
    if (filters.userId) {
      where.userId = filters.userId;
    }

    // Filtro por data
    if (filters.startDate || filters.endDate) {
      where.checkedInAt = {};
      if (filters.startDate) {
        where.checkedInAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.checkedInAt.lte = filters.endDate;
      }
    }

    // Filtro por validação
    if (filters.validated === true) {
      where.validatedAt = { not: null };
    } else if (filters.validated === false) {
      where.validatedAt = null;
    }

    const [data, total] = await Promise.all([
      prisma.checkIn.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          checkedInAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.checkIn.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUser(userId: string, limit = 10): Promise<CheckIn[]> {
    return prisma.checkIn.findMany({
      where: { userId },
      take: limit,
      orderBy: {
        checkedInAt: 'desc',
      },
    });
  }

  async validate(id: string): Promise<CheckIn> {
    return prisma.checkIn.update({
      where: { id },
      data: {
        validatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async countToday(gymId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.checkIn.count({
      where: {
        gymId,
        checkedInAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  async countThisWeek(gymId: string): Promise<number> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return prisma.checkIn.count({
      where: {
        gymId,
        checkedInAt: {
          gte: startOfWeek,
        },
      },
    });
  }

  async countThisMonth(gymId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return prisma.checkIn.count({
      where: {
        gymId,
        checkedInAt: {
          gte: startOfMonth,
        },
      },
    });
  }

  async getStats(gymId: string): Promise<CheckInStats> {
    const [totalToday, totalWeek, totalMonth, mostActive] = await Promise.all([
      this.countToday(gymId),
      this.countThisWeek(gymId),
      this.countThisMonth(gymId),
      prisma.checkIn.groupBy({
        by: ['userId'],
        where: {
          gymId,
          checkedInAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    // Buscar nomes dos usuários mais ativos
    const userIds = mostActive.map(m => m.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const mostActiveUsers = mostActive.map(m => {
      const user = users.find(u => u.id === m.userId);
      return {
        userId: m.userId,
        userName: user?.name || 'Desconhecido',
        count: m._count.id,
      };
    });

    // Calcular média por dia (últimos 30 dias)
    const averagePerDay = Math.round(totalMonth / 30);

    return {
      totalToday,
      totalWeek,
      totalMonth,
      averagePerDay,
      mostActiveUsers,
    };
  }
}