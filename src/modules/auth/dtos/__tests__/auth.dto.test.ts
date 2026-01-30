import 'dotenv/config';
import { registerSchema, loginSchema } from '../auth.dto';
import { Role } from '@prisma/client';
import { ZodError } from 'zod';

function handleZodError(error: unknown, testName: string): void {
  if (error instanceof ZodError) {
    console.log(`   ✅ ${testName} rejeitado corretamente`);
    if (error.errors && error.errors.length > 0) {
      error.errors.forEach((err, index) => {
        const fieldName = err.path && err.path.length > 0 ? err.path.join('.') : 'campo';
        console.log(`   ${index + 1}. ${fieldName}: ${err.message}`);
      });
    }
    console.log();
  } else {
    console.log(`   ✅ ${testName} rejeitado (erro genérico)`);
    console.log();
  }
}

function testAuthDTOs() {
  console.log('🧪 Testando DTOs de Autenticação...\n');

  // ========================================
  // TESTE 1: Registro VÁLIDO
  // ========================================
  console.log('1️⃣ Testando registro VÁLIDO...');
  try {
    const validData = registerSchema.parse({
      name: 'João Silva',
      email: 'JOAO@GMAIL.COM',
      password: 'Senha123',
      gymId: '123e4567-e89b-12d3-a456-426614174000',
      role: Role.MEMBER,
      cpf: '12345678901',
      phone: '11987654321',
    });

    console.log(`   ✅ Dados válidos!`);
    console.log(`   Nome: ${validData.name}`);
    console.log(`   Email normalizado: ${validData.email}`);
    console.log(`   Role: ${validData.role}\n`);
  } catch (error) {
    console.log(`   ❌ Erro inesperado no teste 1`);
    handleZodError(error, 'Dados válidos');
  }

  // ========================================
  // TESTE 2: Registro com campos opcionais VAZIOS
  // ========================================
  console.log('2️⃣ Testando registro sem campos opcionais...');
  try {
    const minimalData = registerSchema.parse({
      name: 'Maria Santos',
      email: 'maria@example.com',
      password: 'Senha456',
      gymId: '123e4567-e89b-12d3-a456-426614174001',
    });

    console.log(`   ✅ Registro mínimo aceito!`);
    console.log(`   Role padrão: ${minimalData.role}`);
    console.log(`   CPF: ${minimalData.cpf || 'não informado'}\n`);
  } catch (error) {
    console.log(`   ❌ Erro inesperado no teste 2`);
    handleZodError(error, 'Registro mínimo');
  }

  // ========================================
  // TESTE 3: Senha FRACA
  // ========================================
  console.log('3️⃣ Testando senha FRACA...');
  try {
    registerSchema.parse({
      name: 'Pedro Costa',
      email: 'pedro@example.com',
      password: 'senha123',
      gymId: '123e4567-e89b-12d3-a456-426614174002',
    });
    console.log(`   ❌ Senha fraca foi aceita (BUG!)\n`);
  } catch (error) {
    handleZodError(error, 'Senha fraca');
  }

  // ========================================
  // TESTE 4: E-mail INVÁLIDO
  // ========================================
  console.log('4️⃣ Testando e-mail INVÁLIDO...');
  try {
    registerSchema.parse({
      name: 'Ana Lima',
      email: 'email-invalido',
      password: 'Senha789',
      gymId: '123e4567-e89b-12d3-a456-426614174003',
    });
    console.log(`   ❌ E-mail inválido foi aceito (BUG!)\n`);
  } catch (error) {
    handleZodError(error, 'E-mail inválido');
  }

  // ========================================
  // TESTE 5: UUID INVÁLIDO
  // ========================================
  console.log('5️⃣ Testando UUID inválido...');
  try {
    registerSchema.parse({
      name: 'Carlos Souza',
      email: 'carlos@example.com',
      password: 'Senha000',
      gymId: 'abc123',
    });
    console.log(`   ❌ UUID inválido foi aceito (BUG!)\n`);
  } catch (error) {
    handleZodError(error, 'UUID inválido');
  }

  // ========================================
  // TESTE 6: CPF INVÁLIDO
  // ========================================
  console.log('6️⃣ Testando CPF inválido...');
  try {
    registerSchema.parse({
      name: 'Fernanda Alves',
      email: 'fernanda@example.com',
      password: 'Senha111',
      gymId: '123e4567-e89b-12d3-a456-426614174004',
      cpf: '123',
    });
    console.log(`   ❌ CPF inválido foi aceito (BUG!)\n`);
  } catch (error) {
    handleZodError(error, 'CPF inválido');
  }

  // ========================================
  // TESTE 7: Login VÁLIDO
  // ========================================
  console.log('7️⃣ Testando login VÁLIDO...');
  try {
    const loginData = loginSchema.parse({
      email: 'USUARIO@EXAMPLE.COM',
      password: 'qualquerSenha',
      gymId: '123e4567-e89b-12d3-a456-426614174005',
    });

    console.log(`   ✅ Login válido!`);
    console.log(`   Email normalizado: ${loginData.email}\n`);
  } catch (error) {
    console.log(`   ❌ Erro inesperado no teste 7`);
    handleZodError(error, 'Login válido');
  }

  // ========================================
  // TESTE 8: Múltiplos Erros
  // ========================================
  console.log('8️⃣ Testando múltiplos erros simultâneos...');
  try {
    registerSchema.parse({
      name: 'AB',
      email: 'invalido',
      password: '123',
      gymId: 'abc',
    });
    console.log(`   ❌ Dados inválidos foram aceitos (BUG!)\n`);
  } catch (error) {
    if (error instanceof ZodError && error.errors && error.errors.length > 0) {
      console.log(`   ✅ ${error.errors.length} erros detectados:`);
      error.errors.forEach((err, index) => {
        const fieldName = err.path && err.path.length > 0 ? err.path.join('.') : 'campo';
        console.log(`      ${index + 1}. ${fieldName}: ${err.message}`);
      });
      console.log();
    } else {
      console.log(`   ✅ Múltiplos erros detectados (genérico)\n`);
    }
  }

  // ========================================
  // TESTE 9: Campos opcionais com strings vazias
  // ========================================
  console.log('9️⃣ Testando campos opcionais com strings vazias...');
  try {
    const dataWithEmptyFields = registerSchema.parse({
      name: 'Roberto Silva',
      email: 'roberto@example.com',
      password: 'Senha999',
      gymId: '123e4567-e89b-12d3-a456-426614174006',
      cpf: '',
      phone: '',
    });

    console.log(`   ✅ Campos opcionais vazios aceitos!`);
    console.log(`   CPF: ${dataWithEmptyFields.cpf || 'vazio'}`);
    console.log(`   Phone: ${dataWithEmptyFields.phone || 'vazio'}\n`);
  } catch (error) {
    console.log(`   ❌ Erro inesperado no teste 9`);
    handleZodError(error, 'Campos opcionais vazios');
  }

  // ========================================
  // TESTE 10: Login com dados inválidos
  // ========================================
  console.log('🔟 Testando login com dados inválidos...');
  try {
    loginSchema.parse({
      email: 'email-sem-arroba',
      password: '',
      gymId: 'uuid-invalido',
    });
    console.log(`   ❌ Login inválido foi aceito (BUG!)\n`);
  } catch (error) {
    handleZodError(error, 'Login inválido');
  }

  console.log('✅ Todos os testes de DTOs concluídos!');
}

testAuthDTOs();