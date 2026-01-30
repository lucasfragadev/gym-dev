import express, { type Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from '@/shared/middlewares/error-handler';
import { healthRouter } from '@/shared/routes/health.routes';
import { authRouter } from '@/modules/auth/routes/auth.routes';


export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
    this.errorHandling();
  }

  private middlewares(): void {
    // CORS configurado para desenvolvimento local e rede
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
      // Permitir qualquer IP da rede local em desenvolvimento
      ...(process.env.NODE_ENV === 'development' 
        ? [/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/]
        : []
      ),
    ].filter(Boolean);

    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Permitir requisições sem origin
          if (!origin) return callback(null, true);

          // Verificar se origin está na lista ou match regex
          const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
              return allowed.test(origin);
            }
            return allowed === origin;
          });

          if (isAllowed) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true, // Permite envio de cookies
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Parsers
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    // Headers de segurança básicos
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  private routes(): void {
    // Rota de health check
    this.app.use('/health', healthRouter);
    this.app.use('/api/auth', authRouter);
  }

  private errorHandling(): void {
    this.app.use(errorHandler);
  }
}