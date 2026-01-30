import { z } from 'zod';
import { Role } from '@prisma/client';

/**
 * Schema de validação para registro de usuário
 */
export const registerSchema = z.object({
  name: z
    .string({
      required_error: 'Nome é obrigatório',
      invalid_type_error: 'Nome deve ser uma string',
    })
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  email: z
    .string({
      required_error: 'E-mail é obrigatório',
      invalid_type_error: 'E-mail deve ser uma string',
    })
    .email('E-mail inválido')
    .toLowerCase()
    .trim(),

  password: z
    .string({
      required_error: 'Senha é obrigatória',
      invalid_type_error: 'Senha deve ser uma string',
    })
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    ),

  gymId: z
    .string({
      required_error: 'ID da academia é obrigatório',
      invalid_type_error: 'ID da academia deve ser uma string',
    })
    .uuid('ID da academia inválido'),

  role: z
    .nativeEnum(Role, {
      errorMap: () => ({ message: 'Role inválido. Use: ADMIN, INSTRUCTOR ou MEMBER' }),
    })
    .default(Role.MEMBER),

  cpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve conter 11 dígitos')
    .optional()
    .or(z.literal('')),

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
});

/**
 * Schema de validação para login
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'E-mail é obrigatório',
    })
    .email('E-mail inválido')
    .toLowerCase()
    .trim(),

  password: z.string({
    required_error: 'Senha é obrigatória',
  }),

  gymId: z
    .string({
      required_error: 'ID da academia é obrigatório',
    })
    .uuid('ID da academia inválido'),
});

/**
 * Schema de validação para refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string({
    required_error: 'Refresh token é obrigatório',
  }),
});

/**
 * Inferência de tipos TypeScript a partir dos schemas
 */
export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type RefreshTokenDTO = z.infer<typeof refreshTokenSchema>;