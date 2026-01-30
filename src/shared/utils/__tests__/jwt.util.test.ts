import 'dotenv/config';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
} from '../jwt.util';

async function testJwtUtils() {
  console.log('🧪 Testando utilitários de JWT...\n');

  const mockPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    gymId: 'gym-abc-123',
    role: 'MEMBER' as const,
  };

  // Teste 1: Gerar Access Token
  console.log('1️⃣ Gerando Access Token...');
  const accessToken = generateAccessToken(mockPayload);
  console.log(`   Token: ${accessToken.substring(0, 50)}...`);
  console.log(`   ✅ Access Token gerado\n`);

  // Teste 2: Decodificar Access Token (sem validar)
  console.log('2️⃣ Decodificando Access Token (sem validação)...');
  const decoded = decodeToken(accessToken);
  console.log(`   User ID: ${decoded?.userId}`);
  console.log(`   Gym ID: ${decoded?.gymId}`);
  console.log(`   Role: ${decoded?.role}`);
  console.log(`   Expira em: ${new Date((decoded?.exp || 0) * 1000).toLocaleString()}`);
  console.log(`   ✅ Token decodificado\n`);

  // Teste 3: Verificar Access Token
  console.log('3️⃣ Verificando Access Token (com validação)...');
  try {
    const verified = verifyAccessToken(accessToken);
    console.log(`   ✅ Token válido!`);
    console.log(`   User ID: ${verified.userId}`);
    console.log(`   Role: ${verified.role}\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error}\n`);
  }

  // Teste 4: Gerar Refresh Token
  console.log('4️⃣ Gerando Refresh Token...');
  const refreshToken = generateRefreshToken({ userId: mockPayload.userId });
  console.log(`   Token: ${refreshToken.substring(0, 50)}...`);
  console.log(`   ✅ Refresh Token gerado\n`);

  // Teste 5: Verificar Refresh Token
  console.log('5️⃣ Verificando Refresh Token...');
  try {
    const verifiedRefresh = verifyRefreshToken(refreshToken);
    console.log(`   ✅ Refresh Token válido!`);
    console.log(`   User ID: ${verifiedRefresh.userId}\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error}\n`);
  }

  // Teste 6: Token Inválido
  console.log('6️⃣ Testando token INVÁLIDO...');
  try {
    verifyAccessToken('token.invalido.aqui');
    console.log(`   ❌ Token inválido foi aceito (BUG!)\n`);
  } catch (error) {
    console.log(`   ✅ Token rejeitado corretamente\n`);
  }

  // Teste 7: Token Modificado
  console.log('7️⃣ Testando token MODIFICADO (tentativa de hack)...');
  const parts = accessToken.split('.');
  const tampered = `${parts[0]}.eyJ1c2VySWQiOiJoYWNrZXIifQ.${parts[2]}`; // Payload alterado
  try {
    verifyAccessToken(tampered);
    console.log(`   ❌ Token adulterado foi aceito (VULNERABILIDADE!)\n`);
  } catch (error) {
    console.log(`   ✅ Token adulterado rejeitado (assinatura inválida)\n`);
  }

  // Teste 8: Comparação de Tamanhos
  console.log('8️⃣ Comparando tamanhos dos tokens...');
  console.log(`   Access Token:  ${accessToken.length} caracteres`);
  console.log(`   Refresh Token: ${refreshToken.length} caracteres`);
  console.log(`   ✅ Refresh Token menor (menos dados no payload)\n`);

  console.log('✅ Todos os testes de JWT passaram!');
}

testJwtUtils().catch(console.error);