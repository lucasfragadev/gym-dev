import 'dotenv/config';
import { UserService } from '../user.service';
import { PrismaUserRepository } from '@/modules/users/repositories/prisma-user.repository';
import { Role } from '@prisma/client';
import { prisma } from '@/config/database';
import { hashPassword } from '@/shared/utils/password.util';

async function testUserService() {
  console.log('🧪 Testando User Service...\n');

  const userRepository = new PrismaUserRepository();
  const userService = new UserService(userRepository);

  let testGymId: string;
  let adminUserId: string;
  let instructorUserId: string;
  let memberUserId: string;

  try {
    // ========================================
    // SETUP: Criar academia e usuários
    // ========================================
    console.log('🏗️  Setup: Criando dados de teste...');
    
    const gym = await prisma.gym.create({
      data: {
        name: 'Academia User Service Test',
        slug: `user-service-test-${Date.now()}`,
        email: `test-${Date.now()}@gym.com`,
      },
    });
    testGymId = gym.id;

    const passwordHash = await hashPassword('Senha123');

    // Criar admin
    const admin = await userRepository.create({
      gymId: testGymId,
      name: 'Admin Teste',
      email: `admin-${Date.now()}@test.com`,
      passwordHash,
      role: Role.ADMIN,
    });
    adminUserId = admin.id;

    // Criar instructor
    const instructor = await userRepository.create({
      gymId: testGymId,
      name: 'Instrutor Teste',
      email: `instructor-${Date.now()}@test.com`,
      passwordHash,
      role: Role.INSTRUCTOR,
    });
    instructorUserId = instructor.id;

    // Criar member
    const member = await userRepository.create({
      gymId: testGymId,
      name: 'Membro Teste',
      email: `member-${Date.now()}@test.com`,
      passwordHash,
      role: Role.MEMBER,
    });
    memberUserId = member.id;

    console.log(`   ✅ Academia e usuários criados\n`);

    // ========================================
    // TESTE 1: Admin listando usuários
    // ========================================
    console.log('1️⃣ Testando admin listar usuários...');
    const listResult = await userService.listUsers(
      { page: 1, limit: 10 },
      adminUserId,
      Role.ADMIN,
      testGymId
    );
    console.log(`   Total de usuários: ${listResult.meta.total}`);
    console.log(`   ✅ Admin pode listar usuários\n`);

    // ========================================
    // TESTE 2: Member tentando listar usuários
    // ========================================
    console.log('2️⃣ Testando member listar usuários...');
    try {
      await userService.listUsers(
        { page: 1, limit: 10 },
        memberUserId,
        Role.MEMBER,
        testGymId
      );
      console.log(`   ❌ Member conseguiu listar (BUG!)\n`);
    } catch (error: any) {
      console.log(`   ✅ Member bloqueado: ${error.message}\n`);
    }

    // ========================================
    // TESTE 3: Usuário atualizando próprio perfil
    // ========================================
    console.log('3️⃣ Testando atualizar próprio perfil...');
    const updatedProfile = await userService.updateOwnProfile(memberUserId, {
      name: 'Membro Atualizado',
      phone: '11987654321',
    });
    console.log(`   Nome atualizado: ${updatedProfile.name}`);
    console.log(`   Telefone: ${updatedProfile.phone}`);
    console.log(`   ✅ Perfil atualizado\n`);

    // ========================================
    // TESTE 4: Admin atualizando outro usuário
    // ========================================
    console.log('4️⃣ Testando admin atualizar outro usuário...');
    const updatedByAdmin = await userService.updateUser(
      memberUserId,
      { name: 'Nome Alterado por Admin', role: Role.INSTRUCTOR },
      adminUserId,
      Role.ADMIN,
      testGymId
    );
    console.log(`   Nome: ${updatedByAdmin.name}`);
    console.log(`   Nova role: ${updatedByAdmin.role}`);
    console.log(`   ✅ Admin atualizou com sucesso\n`);

    // ========================================
    // TESTE 5: Member tentando atualizar outro usuário
    // ========================================
    console.log('5️⃣ Testando member atualizar outro usuário...');
    try {
      await userService.updateUser(
        instructorUserId,
        { name: 'Hack' },
        memberUserId,
        Role.MEMBER,
        testGymId
      );
      console.log(`   ❌ Member conseguiu atualizar (BUG!)\n`);
    } catch (error: any) {
      console.log(`   ✅ Member bloqueado: ${error.message}\n`);
    }

    // ========================================
    // TESTE 6: Buscar usuário por ID
    // ========================================
    console.log('6️⃣ Testando buscar usuário por ID...');
    const foundUser = await userService.getUserById(
      instructorUserId,
      adminUserId,
      Role.ADMIN,
      testGymId
    );
    console.log(`   Usuário encontrado: ${foundUser.name}`);
    console.log(`   Senha no retorno: ${(foundUser as any).passwordHash ? 'SIM (BUG!)' : 'NÃO (correto)'}`);
    console.log(`   ✅ Busca realizada\n`);

    // ========================================
    // TESTE 7: Desativar usuário
    // ========================================
    console.log('7️⃣ Testando desativar usuário...');
    const deactivated = await userService.deactivateUser(
      memberUserId,
      adminUserId,
      Role.ADMIN,
      testGymId
    );
    console.log(`   Usuário inativo: ${!deactivated.isActive}`);
    console.log(`   ✅ Usuário desativado\n`);

    // ========================================
    // TESTE 8: Reativar usuário
    // ========================================
    console.log('8️⃣ Testando reativar usuário...');
    const reactivated = await userService.reactivateUser(
      memberUserId,
      adminUserId,
      Role.ADMIN,
      testGymId
    );
    console.log(`   Usuário ativo: ${reactivated.isActive}`);
    console.log(`   ✅ Usuário reativado\n`);

    // ========================================
    // TESTE 9: Estatísticas da academia
    // ========================================
    console.log('9️⃣ Testando estatísticas...');
    const stats = await userService.getGymStats(Role.ADMIN, testGymId);
    console.log(`   Total ativo: ${stats.totalActive}`);
    console.log(`   Membros: ${stats.byRole.members}`);
    console.log(`   Instrutores: ${stats.byRole.instructors}`);
    console.log(`   Admins: ${stats.byRole.admins}`);
    console.log(`   ✅ Estatísticas obtidas\n`);

    console.log('✅ Todos os testes do User Service passaram!\n');
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  } finally {
    // ========================================
    // CLEANUP
    // ========================================
    console.log('🧹 Limpando dados...');
    try {
      if (memberUserId) await prisma.user.delete({ where: { id: memberUserId } }).catch(() => {});
      if (instructorUserId) await prisma.user.delete({ where: { id: instructorUserId } }).catch(() => {});
      if (adminUserId) await prisma.user.delete({ where: { id: adminUserId } }).catch(() => {});
      if (testGymId) await prisma.gym.delete({ where: { id: testGymId } }).catch(() => {});
      console.log('   ✅ Dados limpos');
    } catch (cleanupError) {
      console.log('   ⚠️  Erro na limpeza');
    }
    await prisma.$disconnect();
    console.log('   ✅ Conexão encerrada\n');
  }
}

testUserService();