import { Request, Response } from 'express';
import { prisma } from '@/config/database';

export class HealthController {
  async check(req: Request, res: Response): Promise<Response> {
    try {
      // Testar conexão com o banco
      await prisma.$queryRaw`SELECT 1`;

      const uptime = process.uptime();
      const timestamp = new Date().toISOString();

      return res.status(200).json({
        status: 'healthy',
        timestamp,
        uptime: `${Math.floor(uptime)}s`,
        database: 'connected',
        environment: process.env.NODE_ENV || 'development',
      });
    } catch (error) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}