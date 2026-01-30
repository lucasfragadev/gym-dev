import { z } from 'zod';

/**
 * DTO para criar check-in
 * (gymId e userId virão do contexto autenticado)
 */
export const createCheckInSchema = z.object({
  // Vazio por enquanto - dados vêm da autenticação
  // Pode adicionar campos futuros como: latitude, longitude, etc.
});

/**
 * DTO para validar check-in
 */
export const validateCheckInSchema = z.object({
  checkInId: z.string().uuid('ID de check-in inválido'),
});

/**
 * DTO para filtros de listagem
 */
export const listCheckInsFiltersSchema = z.object({
  userId: z.string().uuid('ID de usuário inválido').optional(),
  
  startDate: z
    .string()
    .datetime('Data inicial inválida')
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
  
  endDate: z
    .string()
    .datetime('Data final inválida')
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),
  
  validated: z
    .string()
    .transform(val => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    })
    .optional(),
  
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('1'),
  
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('20'),
});

/**
 * Tipos inferidos
 */
export type CreateCheckInDTO = z.infer<typeof createCheckInSchema>;
export type ValidateCheckInDTO = z.infer<typeof validateCheckInSchema>;
export type ListCheckInsFiltersDTO = z.infer<typeof listCheckInsFiltersSchema>;