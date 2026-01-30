import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors/app-error';
import { Prisma } from '@prisma/client';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Erro operacional
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
  }

  // Erros do Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, res);
  }

  // Erro desconhecido 
  console.error('💥 Unexpected error:', error);

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}

function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  res: Response
) {
  switch (error.code) {
    case 'P2002':
      return res.status(409).json({
        status: 'error',
        message: 'A record with this value already exists',
        field: error.meta?.target,
      });

    case 'P2025':
      return res.status(404).json({
        status: 'error',
        message: 'Record not found',
      });

    default:
      return res.status(400).json({
        status: 'error',
        message: 'Database error',
        code: error.code,
      });
  }
}