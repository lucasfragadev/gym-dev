import 'dotenv/config';
import { App } from './app';

const PORT = process.env.PORT || 3333;
const HOST = process.env.HOST || '0.0.0.0'; // ← Mudança aqui

const { app } = new App();

// Iniciar servidor (apenas em ambiente local)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on:`);
    console.log(`   - Local:   http://localhost:${PORT}`);
    console.log(`   - Network: http://${getLocalIp()}:${PORT}`);
    console.log(`📚 Health check: http://${getLocalIp()}:${PORT}/health`);
  });
}

// Função para obter IP local
function getLocalIp(): string {
  const os = require('node:os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Pular endereços internos e não IPv4
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

// Exportar para Vercel
export default app;