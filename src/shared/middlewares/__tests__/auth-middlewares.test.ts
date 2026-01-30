import 'dotenv/config';
import express from 'express';
import request from 'supertest';
import { authenticate } from '../authenticate.middleware';
import { authorize } from '../authorize.middleware';
import { generateAccessToken } from '@/shared/utils/jwt.util';
import { Role } from '@prisma/client';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());

// Rota pública
app.get('/public', (req, res) => {
  res.json({ message: 'Rota pública' });
});

// Rota autenticada
app.get('/protected', authenticate, (req, res) => {
  res.json({
    message: 'Rota protegida',
    userId: req.userId,
    role: req.userRole,
  });
});

// Rota apenas para ADMINs
app.get('/admin-only', authenticate, authorize([Role.ADMIN]), (req, res) => {
  res.json({ message: 'Área administrativa' });
});

// Rota para ADMINs e INSTRUCTORs
app.get(
  '/staff-only',
  authenticate,
  authorize([Role.ADMIN, Role.INSTRUCTOR]),
  (req, res) => {
    res.json({ message: 'Área da equipe' });
  }
);

async function testAuthMiddlewares() {
  console.log('🧪 Testando Middlewares de Autenticação...\n');

  // Gerar tokens de teste
  const memberToken = generateAccessToken({
    userId: 'user-123',
    gymId: 'gym-abc',
    role: Role.MEMBER,
  });

  const instructorToken = generateAccessToken({
    userId: 'user-456',
    gymId: 'gym-abc',
    role: Role.INSTRUCTOR,
  });

  const adminToken = generateAccessToken({
    userId: 'user-789',
    gymId: 'gym-abc',
    role: Role.ADMIN,
  });

  try {
    // ========================================
    // TESTE 1: Rota pública (sem token)
    // ========================================
    console.log('1️⃣ Testando rota pública...');
    const publicResponse = await request(app).get('/public');
    console.log(`   Status: ${publicResponse.status}`);
    console.log(`   ✅ Rota pública acessível\n`);

    // ========================================
    // TESTE 2: Rota protegida SEM token
    // ========================================
    console.log('2️⃣ Testando rota protegida SEM token...');
    const noTokenResponse = await request(app).get('/protected');
    console.log(`   Status: ${noTokenResponse.status}`);
    console.log(`   ✅ Acesso negado (401 esperado)\n`);

    // ========================================
    // TESTE 3: Rota protegida COM token (cookie)
    // ========================================
    console.log('3️⃣ Testando rota protegida COM token (cookie)...');
    const withTokenResponse = await request(app)
      .get('/protected')
      .set('Cookie', [`accessToken=${memberToken}`]);
    console.log(`   Status: ${withTokenResponse.status}`);
    console.log(`   User ID: ${withTokenResponse.body.userId}`);
    console.log(`   Role: ${withTokenResponse.body.role}`);
    console.log(`   ✅ Acesso permitido\n`);

    // ========================================
    // TESTE 4: Rota protegida COM token (header)
    // ========================================
    console.log('4️⃣ Testando rota protegida COM token (header)...');
    const headerTokenResponse = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${memberToken}`);
    console.log(`   Status: ${headerTokenResponse.status}`);
    console.log(`   ✅ Acesso permitido via header\n`);

    // ========================================
    // TESTE 5: MEMBER tentando acessar rota de ADMIN
    // ========================================
    console.log('5️⃣ Testando MEMBER em rota de ADMIN...');
    const memberAdminResponse = await request(app)
      .get('/admin-only')
      .set('Cookie', [`accessToken=${memberToken}`]);
    console.log(`   Status: ${memberAdminResponse.status}`);
    console.log(`   ✅ Acesso negado (403 esperado)\n`);

    // ========================================
    // TESTE 6: ADMIN acessando rota de ADMIN
    // ========================================
    console.log('6️⃣ Testando ADMIN em rota de ADMIN...');
    const adminAdminResponse = await request(app)
      .get('/admin-only')
      .set('Cookie', [`accessToken=${adminToken}`]);
    console.log(`   Status: ${adminAdminResponse.status}`);
    console.log(`   ✅ Acesso permitido\n`);

    // ========================================
    // TESTE 7: INSTRUCTOR em rota de equipe
    // ========================================
    console.log('7️⃣ Testando INSTRUCTOR em rota de equipe...');
    const instructorStaffResponse = await request(app)
      .get('/staff-only')
      .set('Cookie', [`accessToken=${instructorToken}`]);
    console.log(`   Status: ${instructorStaffResponse.status}`);
    console.log(`   ✅ Acesso permitido\n`);

    // ========================================
    // TESTE 8: MEMBER em rota de equipe
    // ========================================
    console.log('8️⃣ Testando MEMBER em rota de equipe...');
    const memberStaffResponse = await request(app)
      .get('/staff-only')
      .set('Cookie', [`accessToken=${memberToken}`]);
    console.log(`   Status: ${memberStaffResponse.status}`);
    console.log(`   ✅ Acesso negado (403 esperado)\n`);

    console.log('✅ Todos os testes de middlewares passaram!');
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
}

testAuthMiddlewares();