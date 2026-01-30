import { Role } from '@prisma/client';

/**
 * Payload do Access Token (token de curta duração)
 * Contém informações completas do usuário para autorização
 */
export interface JwtPayload {
  userId: string;
  gymId: string;
  role: Role;
}

/**
 * Payload do Refresh Token (token de longa duração)
 * Contém apenas informações mínimas para segurança
 */
export interface RefreshTokenPayload {
  userId: string;
}

/**
 * Payload decodificado com informações do JWT padrão
 */
export interface DecodedToken extends JwtPayload {
  iat: number; // Issued At (timestamp)
  exp: number; // Expiration (timestamp)
}