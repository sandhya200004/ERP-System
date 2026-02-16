import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ========================================
  // SECURITY: Helmet - Secure HTTP Headers
  // ========================================
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Swagger needs unsafe-eval
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
    }),
  );

  // ========================================
  // SECURITY: Cookie Parser (for session management)
  // ========================================
  app.use(cookieParser());

  // ========================================
  // SECURITY: Global Exception Filter
  // Prevents leaking sensitive error details
  // ========================================
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ========================================
  // SECURITY: Global Validation Pipe
  // Prevents mass-assignment attacks
  // ========================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties sent
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS - allow local network and production origins
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      // Allow localhost and local network IPs on any port
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.endsWith('.vercel.app') || // Vercel deployments
        origin.endsWith('.onrender.com') || // Render deployments
        origin === process.env.FRONTEND_URL // Custom domain
      ) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  });

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('TriVerse ERP API')
    .setDescription('API documentation for TriVerse ERP system')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 TriVerse ERP Backend running on http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}bootstrap();
