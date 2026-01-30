import 'dotenv/config';
import { AuthService } from '../auth.service';
import { PrismaUserRepository } from '@/modules/users/repositories/prisma-user.repository';
import { Role } from '@prisma/client';
import { prisma } from '@/config/database';

async function testAuthService() {
  console.log('🧪 Testando Auth Service...\n');

  const userRepository = new PrismaUserRepository();
  const authService = new AuthService(userRepository);

  let testGymId: string;
  let testUserId: string;

  try {
    // ========================================
    // SETUP: Criar academia
    // ========================================
    console.log('🏗️  Setup: Criando academia...');
    const gym = await prisma.gym.create({
      data: {
        name: 'Academia Auth Test',
        slug: `auth-test-${Date.now()}`,
        email: `auth-${Date.now()}@gym.com`,
      },
    });
    testGymId = gym.id;
    console.log(`   ✅ Academia criada: ${gym.id}\n`);

    // ========================================
    // TESTE 1: Registro de usuário
    // ========================================
    console.log('1️⃣ Testando registro de usuário...');
    const registerData = {
      gymId: testGymId,
      name: 'Maria Silva',
      email: `maria-${Date.now()}@example.com`,
      password: 'Senha123',
      role: Role.MEMBER,
      cpf: `${Math.floor(10000000000 + Math.random() * 90000000000)}`,
      phone: '11987654321',
    };

    const registerResult = await authService.register(registerData);
    testUserId = registerResult.user.id;

    console.log(`   ✅ Usuário registrado: ${registerResult.user.name}`);
    console.log(`   Email: ${registerResult.user.email}`);
    console.log(`   Role: ${registerResult.user.role}`);
    console.log(`   Access Token: ${registerResult.accessToken.substring(0, 30)}...`);
    console.log(`   Refresh Token: ${registerResult.refreshToken.substring(0, 30)}...\n`);

    // ========================================
    // TESTE 2: Tentar registrar email duplicado
    // ========================================
    console.log('2️⃣ Testando email duplicado...');
    try {
      await authService.register(registerData);
      console.log(`   ❌ Email duplicado foi aceito (BUG!)\n`);
    } catch (error: any) {
      console.log(`   ✅ Email duplicado rejeitado: ${error.message}\n`);
    }

    // ========================================
    // TESTE 3: Login com credenciais corretas
    // ========================================
    console.log('3️⃣ Testando login...');
    const loginResult = await authService.login({
      email: registerData.email,
      password: 'Senha123',
      gymId: testGymId,
    });

    console.log(`   ✅ Login bem-sucedido: ${loginResult.user.name}`);
    console.log(`   Access Token gerado: ${loginResult.accessToken.substring(0, 30)}...\n`);

    // ========================================
    // TESTE 4: Login com senha incorreta
    // ========================================
    console.log('4️⃣ Testando senha incorreta...');
    try {
      await authService.login({
        email: registerData.email,
        password: 'SenhaErrada123',
        gymId: testGymId,
      });
      console.log(`   ❌ Senha incorreta foi aceita (BUG!)\n`);
    } catch (error: any) {
      console.log(`   ✅ Senha incorreta rejeitada: ${error.message}\n`);
    }

    // ========================================
    // TESTE 5: Login com email inexistente
    // ========================================
    console.log('5️⃣ Testando email inexistente...');
    try {
      await authService.login({
        email: 'naoexiste@example.com',
        password: 'Senha123',
        gymId: testGymId,
      });
      console.log(`   ❌ Email inexistente foi aceito (BUG!)\n`);
    } catch (error: any) {
      console.log(`   ✅ Email inexistente rejeitado: ${error.message}\n`);
    }

    // ========================================
    // TESTE 6: Refresh Token
    // ========================================
    console.log('6️⃣ Testando refresh token...');
    const refreshResult = await authService.refreshAccessToken(
      loginResult.refreshToken
    );
    console.log(`   ✅ Novo Access Token gerado: ${refreshResult.accessToken.substring(0, 30)}...\n`);

    // ========================================
    // TESTE 7: Refresh Token inválido
    // ========================================
    console.log('7️⃣ Testando refresh token inválido...');
    try {
      await authService.refreshAccessToken('token.invalido.aqui');
      console.log(`   ❌ Token inválido foi aceito (BUG!)\n`);
    } catch (error: any) {
      console.log(`   ✅ Token inválido rejeitado: ${error.message}\n`);
    }

    // ========================================
    // TESTE 8: Buscar perfil do usuário
    // ========================================
    console.log('8️⃣ Testando buscar perfil...');
    const profile = await authService.getProfile(testUserId);
    console.log(`   ✅ Perfil obtido: ${profile.name}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Senha retornada: ${(profile as any).passwordHash ? 'SIM (BUG!)' : 'NÃO (correto)'}\n`);

    console.log('✅ Todos os testes do Auth Service passaram!\n');
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  } finally {
    // ========================================
    // CLEANUP
    // ========================================
    console.log('🧹 Limpando dados...');
    try {
      if (testUserId) {
        await prisma.user.delete({ where: { id: testUserId } });
        console.log('   ✅ Usuário deletado');
      }
      if (testGymId) {
        await prisma.gym.delete({ where: { id: testGymId } });
        console.log('   ✅ Academia deletada');
      }
    } catch (cleanupError) {
      console.log('   ⚠️  Erro na limpeza');
    }
    await prisma.$disconnect();
    console.log('   ✅ Conexão encerrada\n');
  }
}

testAuthService();