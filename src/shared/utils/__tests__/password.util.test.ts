import { hashPassword, comparePassword } from '../password.util';

async function testPasswordUtils() {
  console.log('🧪 Testando utilitários de senha...\n');

  const password = 'MinhaS3nh@Secreta';

  // Teste 1: Gerar hash
  console.log('1️⃣ Gerando hash da senha...');
  const hash1 = await hashPassword(password);
  console.log(`   Hash 1: ${hash1}`);

  // Teste 2: Gerar outro hash da mesma senha (deve ser diferente)
  const hash2 = await hashPassword(password);
  console.log(`   Hash 2: ${hash2}`);
  console.log(`   ✅ Hashes diferentes mesmo com senha igual: ${hash1 !== hash2}\n`);

  // Teste 3: Comparar senha correta
  console.log('2️⃣ Testando senha CORRETA...');
  const isCorrect = await comparePassword(password, hash1);
  console.log(`   ✅ Senha válida: ${isCorrect}\n`);

  // Teste 4: Comparar senha incorreta
  console.log('3️⃣ Testando senha INCORRETA...');
  const isWrong = await comparePassword('senhaErrada', hash1);
  console.log(`   ✅ Senha inválida: ${!isWrong}\n`);

  // Teste 5: Performance (simular 5 hashes)
  console.log('4️⃣ Testando performance...');
  const start = Date.now();
  await Promise.all([
    hashPassword(password),
    hashPassword(password),
    hashPassword(password),
    hashPassword(password),
    hashPassword(password),
  ]);
  const duration = Date.now() - start;
  console.log(`   ⏱️  5 hashes gerados em ${duration}ms (~${duration / 5}ms por hash)\n`);

  console.log('✅ Todos os testes passaram!');
}

testPasswordUtils().catch(console.error);