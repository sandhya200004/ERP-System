import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug'],
  });

  // ========================================
  // PERFORMANCE: Compression - Reduce response size
  // ========================================
  app.use(compression());

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

  // CORS - allow local network, production origins, and multi-tenant subdomains
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      const allowedDomains = [
        'localhost',
        '127.0.0.1',
        '192.168.',
        '10.',
        '.vercel.app',
        '.onrender.com',
        process.env.BASE_DOMAIN || 'myerp.com', // Main domain for multi-tenant subdomains
      ];

      // Check if origin matches any allowed domain
      const isAllowed = allowedDomains.some((domain) => {
        if (domain.startsWith('.')) {
          // For wildcards like .vercel.app, .myerp.com
          return origin.includes(domain);
        }
        return origin.includes(domain);
      });

      if (isAllowed || origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Tenant-Subdomain'],
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

  // Root path welcome endpoint
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (req: any, res: any) => {
    res.json({
      name: 'TriVerse ERP API',
      version: '1.0.0',
      description: 'Enterprise Resource Planning System - Multi-tenant SaaS Platform',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        documentation: '/api/docs',
        health: '/health',
        platformAdmin: '/api/v1/platform-admin',
        authentication: '/api/v1/auth',
        api: '/api/v1',
      },
    });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 TriVerse ERP Backend running on http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}bootstrap();
