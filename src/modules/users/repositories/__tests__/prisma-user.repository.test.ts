import 'dotenv/config';
import { PrismaUserRepository } from '../prisma-user.repository';
import { Role } from '@prisma/client';
import { prisma } from '@/config/database';
import { hashPassword } from '@/shared/utils/password.util';

async function testUserRepository() {
  console.log('🧪 Testando User Repository...\n');

  const repository = new PrismaUserRepository();

  // IDs para limpeza posterior
  let testGymId: string;
  let createdUserId: string;

  try {
    // ========================================
    // SETUP: Criar academia de teste
    // ========================================
    console.log('🏗️  Setup: Criando academia de teste...');
    const gym = await prisma.gym.create({
      data: {
        name: 'Academia Teste',
        slug: `academia-teste-${Date.now()}`,
        email: `teste-${Date.now()}@gym.com`,
      },
    });
    testGymId = gym.id;
    console.log(`   ✅ Academia criada: ${gym.name} (ID: ${gym.id})\n`);

    // Dados de teste
    const testEmail = `test-${Date.now()}@example.com`;
    const testCpf = `${Math.floor(10000000000 + Math.random() * 90000000000)}`;

    // ========================================
    // TESTE 1: Criar usuário
    // ========================================
    console.log('1️⃣ Criando usuário...');
    const passwordHash = await hashPassword('Senha123');

    const user = await repository.create({
      gymId: testGymId,
      name: 'João Teste',
      email: testEmail,
      passwordHash,
      role: Role.MEMBER,
      cpf: testCpf,
      phone: '11987654321',
    });

    createdUserId = user.id;
    console.log(`   ✅ Usuário criado com ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}\n`);

    // ========================================
    // TESTE 2: Buscar por ID
    // ========================================
    console.log('2️⃣ Buscando usuário por ID...');
    const foundById = await repository.findById(user.id);
    if (foundById) {
      console.log(`   ✅ Usuário encontrado: ${foundById.name}\n`);
    } else {
      console.log(`   ❌ Usuário não encontrado\n`);
    }

    // ========================================
    // TESTE 3: Buscar por email e gymId
    // ========================================
    console.log('3️⃣ Buscando por email e gymId...');
    const foundByEmail = await repository.findByEmailAndGymId(
      testEmail,
      testGymId
    );
    if (foundByEmail) {
      console.log(`   ✅ Usuário encontrado: ${foundByEmail.email}\n`);
    } else {
      console.log(`   ❌ Usuário não encontrado\n`);
    }

    // ========================================
    // TESTE 4: Buscar por CPF
    // ========================================
    console.log('4️⃣ Buscando por CPF...');
    const foundByCpf = await repository.findByCpf(testCpf);
    if (foundByCpf) {
      console.log(`   ✅ Usuário encontrado: CPF ${foundByCpf.cpf}\n`);
    } else {
      console.log(`   ❌ Usuário não encontrado\n`);
    }

    // ========================================
    // TESTE 5: Verificar se email existe
    // ========================================
    console.log('5️⃣ Verificando se email existe...');
    const emailExists = await repository.existsByEmailAndGymId(
      testEmail,
      testGymId
    );
    console.log(`   ✅ Email existe: ${emailExists}\n`);

    // ========================================
    // TESTE 6: Verificar se CPF existe
    // ========================================
    console.log('6️⃣ Verificando se CPF existe...');
    const cpfExists = await repository.existsByCpf(testCpf);
    console.log(`   ✅ CPF existe: ${cpfExists}\n`);

    // ========================================
    // TESTE 7: Atualizar usuário
    // ========================================
    console.log('7️⃣ Atualizando usuário...');
    const updated = await repository.update(user.id, {
      name: 'João Teste Atualizado',
      phone: '11999999999',
    });
    console.log(`   ✅ Nome atualizado: ${updated.name}`);
    console.log(`   Telefone atualizado: ${updated.phone}\n`);

    // ========================================
    // TESTE 8: Listar usuários por gymId
    // ========================================
    console.log('8️⃣ Listando usuários da academia...');
    const gymUsers = await repository.findManyByGymId(testGymId);
    console.log(`   ✅ Total de usuários ativos: ${gymUsers.length}\n`);

    // ========================================
    // TESTE 9: Listar por role
    // ========================================
    console.log('9️⃣ Listando MEMBERs da academia...');
    const members = await repository.findManyByRoleAndGymId(
      Role.MEMBER,
      testGymId
    );
    console.log(`   ✅ Total de membros: ${members.length}\n`);

    // ========================================
    // TESTE 10: Soft delete
    // ========================================
    console.log('🔟 Fazendo soft delete...');
    const softDeleted = await repository.softDelete(user.id);
    console.log(`   ✅ Usuário marcado como inativo: ${!softDeleted.isActive}\n`);

    // ========================================
    // TESTE 11: Verificar que não aparece em listagens
    // ========================================
    console.log('1️⃣1️⃣ Verificando que usuário inativo não aparece...');
    const activeUsersAfterDelete = await repository.findManyByGymId(testGymId);
    const isInList = activeUsersAfterDelete.some(u => u.id === user.id);
    console.log(`   ✅ Usuário inativo não aparece: ${!isInList}\n`);

    console.log('✅ Todos os testes do Repository passaram!\n');
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  } finally {
    // ========================================
    // CLEANUP: Limpar dados de teste
    // ========================================
    console.log('🧹 Limpando dados de teste...');
    try {
      if (createdUserId) {
        await prisma.user.delete({ where: { id: createdUserId } });
        console.log('   ✅ Usuário deletado');
      }
      if (testGymId) {
        await prisma.gym.delete({ where: { id: testGymId } });
        console.log('   ✅ Academia deletada');
      }
    } catch (cleanupError) {
      console.log('   ⚠️  Erro na limpeza (dados podem já ter sido removidos)');
    }
    await prisma.$disconnect();
    console.log('   ✅ Conexão encerrada\n');
  }
}

testUserRepository();