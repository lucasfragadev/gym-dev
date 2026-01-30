import jwt from 'jsonwebtoken';
import {
  JwtPayload,
  RefreshTokenPayload,
  DecodedToken,
} from '@/shared/interfaces/jwt-payload.interface';

/**
 * Configurações do JWT a partir das variáveis de ambiente
 */
const JWT_CONFIG = {
  accessSecret: process.env.JWT_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  accessExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// Validação das variáveis de ambiente (fail-fast)
if (!JWT_CONFIG.accessSecret || !JWT_CONFIG.refreshSecret) {
  throw new Error(
    'JWT secrets are not defined. Check JWT_SECRET and JWT_REFRESH_SECRET in .env'
  );
}

/**
 * Gera um Access Token (curta duração)
 * 
 * @param payload - Dados do usuário (userId, gymId, role)
 * @returns Token JWT assinado
 * 
 * @example
 * const token = generateAccessToken({
 *   userId: '123',
 *   gymId: 'gym-abc',
 *   role: 'MEMBER'
 * });
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_CONFIG.accessSecret, {
    expiresIn: JWT_CONFIG.accessExpiresIn,
    issuer: 'gym-saas-api',
    audience: 'gym-saas-client',
  });
}

/**
 * Gera um Refresh Token (longa duração)
 * 
 * @param payload - Dados mínimos do usuário (apenas userId)
 * @returns Token JWT assinado
 * 
 * @example
 * const refreshToken = generateRefreshToken({ userId: '123' });
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, JWT_CONFIG.refreshSecret, {
    expiresIn: JWT_CONFIG.refreshExpiresIn,
    issuer: 'gym-saas-api',
    audience: 'gym-saas-client',
  });
}

/**
 * Valida e decodifica um Access Token
 * 
 * @param token - Token JWT a ser validado
 * @returns Payload decodificado
 * @throws Error se o token for inválido ou expirado
 * 
 * @example
 * try {
 *   const decoded = verifyAccessToken(token);
 *   console.log(decoded.userId); // '123'
 * } catch (error) {
 *   console.log('Token inválido');
 * }
 */
export function verifyAccessToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.accessSecret, {
      issuer: 'gym-saas-api',
      audience: 'gym-saas-client',
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Valida e decodifica um Refresh Token
 * 
 * @param token - Token JWT a ser validado
 * @returns Payload decodificado
 * @throws Error se o token for inválido ou expirado
 * 
 * @example
 * try {
 *   const decoded = verifyRefreshToken(refreshToken);
 *   console.log(decoded.userId); // '123'
 * } catch (error) {
 *   console.log('Refresh token inválido');
 * }
 */
export function verifyRefreshToken(
  token: string
): RefreshTokenPayload & { iat: number; exp: number } {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.refreshSecret, {
      issuer: 'gym-saas-api',
      audience: 'gym-saas-client',
    }) as RefreshTokenPayload & { iat: number; exp: number };

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Decodifica um token SEM validar a assinatura
 * Útil para debugging ou para ler informações antes de validar
 *  
 * @param token - Token JWT
 * @returns Payload decodificado ou null se inválido
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}