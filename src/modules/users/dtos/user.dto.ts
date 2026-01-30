import { z } from 'zod';
import { Role } from '@prisma/client';

/**
 * DTO para atualização de perfil
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),

  phone: z
    .string()
    .regex(/^\d{10,11}$/, 'Telefone deve conter 10 ou 11 dígitos')
    .optional()
    .or(z.literal('')),

  birthDate: z
    .string()
    .datetime('Data de nascimento inválida')
    .or(z.date())
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),

  avatarUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

/**
 * DTO para admin atualizar qualquer usuário
 */
export const updateUserSchema = updateProfileSchema.extend({
  email: z.string().email('E-mail inválido').toLowerCase().optional(),

  role: z.nativeEnum(Role).optional(),

  isActive: z.boolean().optional(),

  cpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve conter 11 dígitos')
    .optional()
    .or(z.literal('')),
});

/**
 * DTO para filtros de listagem
 */
export const listUsersFiltersSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  isActive: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  search: z.string().optional(),
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('1'),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .default('10'),
});

/**
 * Tipos inferidos
 */
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export type ListUsersFiltersDTO = z.infer<typeof listUsersFiltersSchema>;