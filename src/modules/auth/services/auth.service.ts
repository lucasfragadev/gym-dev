import { User, Role } from '@prisma/client';
import { IUserRepository } from '@/modules/users/interfaces/user-repository.interface';
import { hashPassword, comparePassword } from '@/shared/utils/password.util';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/shared/utils/jwt.util';
import { AppError } from '@/shared/errors/app-error';
import { RegisterDTO, LoginDTO } from '../dtos/auth.dto';

/**
 * Resposta do registro/login contendo tokens e dados do usuário
 */
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    gymId: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Service de Autenticação
 * Contém toda a lógica de negócio relacionada à autenticação
 */
export class AuthService {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Registra um novo usuário no sistema
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // 1. Verificar se email já existe na academia
    const emailExists = await this.userRepository.existsByEmailAndGymId(
      data.email,
      data.gymId
    );

    if (emailExists) {
      throw new AppError('E-mail já cadastrado nesta academia', 409);
    }

    // 2. Verificar se CPF já existe (se fornecido)
    if (data.cpf) {
      const cpfExists = await this.userRepository.existsByCpf(data.cpf);
      if (cpfExists) {
        throw new AppError('CPF já cadastrado', 409);
      }
    }

    // 3. Hash da senha
    const passwordHash = await hashPassword(data.password);

    // 4. Criar usuário
    const user = await this.userRepository.create({
      gymId: data.gymId,
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || Role.MEMBER,
      cpf: data.cpf,
      phone: data.phone,
      birthDate: data.birthDate,
    });

    // 5. Gerar tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      gymId: user.gymId,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // 6. Retornar dados (sem senha!)
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        gymId: user.gymId,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Autentica um usuário (login)
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    // 1. Buscar usuário por email e academia
    const user = await this.userRepository.findByEmailAndGymId(
      data.email,
      data.gymId
    );

    if (!user) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // 2. Verificar se usuário está ativo
    if (!user.isActive) {
      throw new AppError('Usuário inativo', 403);
    }

    // 3. Validar senha
    const isPasswordValid = await comparePassword(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // 4. Gerar tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      gymId: user.gymId,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // 5. Retornar dados
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        gymId: user.gymId,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Renova o Access Token usando o Refresh Token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
  }> {
    // 1. Validar Refresh Token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError('Refresh token inválido ou expirado', 401);
    }

    // 2. Buscar usuário
    const user = await this.userRepository.findById(decoded.userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // 3. Verificar se está ativo
    if (!user.isActive) {
      throw new AppError('Usuário inativo', 403);
    }

    // 4. Gerar novo Access Token
    const accessToken = generateAccessToken({
      userId: user.id,
      gymId: user.gymId,
      role: user.role,
    });

    return { accessToken };
  }

  /**
   * Busca dados do usuário autenticado
   */
  async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (!user.isActive) {
      throw new AppError('Usuário inativo', 403);
    }

    // Remover senha do retorno
    const { passwordHash, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}