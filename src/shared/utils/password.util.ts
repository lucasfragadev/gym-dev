import bcrypt from 'bcryptjs';

/**
 * Configuração do custo do hash (rounds)
 * 10 = ~10 hashes/segundo (balanço entre segurança e performance)
 * 12 = ~2 hashes/segundo (mais seguro, mas mais lento)
 * 
 * Para serverless, usamos 10 para não estourar o timeout
 */
const SALT_ROUNDS = 10;

/**
 * Gera um hash seguro da senha usando bcrypt
 * 
 * @param password - Senha em texto plano
 * @returns Hash bcrypt da senha
 * 
 * @example
 * const hash = await hashPassword('minhaSenha123');
 * // hash = "$2a$10$N9qo8uLOickgx2ZMRZoMye..."
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compara uma senha em texto plano com um hash bcrypt
 * 
 * @param password - Senha fornecida pelo usuário
 * @param hash - Hash armazenado no banco de dados
 * @returns true se a senha corresponde ao hash, false caso contrário
 * 
 * @example
 * const isValid = await comparePassword('minhaSenha123', hashDoBanco);
 * if (isValid) {
 *   console.log('Senha correta!');
 * }
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}