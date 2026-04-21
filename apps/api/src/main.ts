// NAČÍTANIE .env PRED VŠETKÝMI IMPORTMI!
// Toto musí byť PRVÉ, aby Prisma Client mal prístup k DATABASE_URL
import { config } from 'dotenv';
import { resolve } from 'path';

// Načítanie .env súboru z root adresára
// Pri vývoji (ts-node-dev) je __dirname v src/, pri produkcii v dist/
const envPath = __dirname.includes('dist') 
  ? resolve(__dirname, '../../../.env')
  : resolve(__dirname, '../../../../.env');
config({ path: envPath, override: true });

// Teraz môžeme importovať ostatné moduly
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AuditErrorInterceptor } from './audit/audit-error.interceptor';
import { AuditService } from './audit/audit.service';
import { prisma } from '@inzertna-platforma/database';
import * as express from 'express';

async function bootstrap() {
  try {
    await prisma.$connect();
  } catch (e) {
    console.error(
      '❌ Prisma / PostgreSQL: nepodarilo sa pripojiť. Skontrolujte, či databázový server beží a či DATABASE_URL v .env smeruje na správny host a port.',
    );
    console.error(e);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  const auditService = app.get(AuditService);
  app.useGlobalInterceptors(new AuditErrorInterceptor(auditService));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3002', // Admin app
      'http://localhost:3003', // User app
      'http://localhost:3000', // Platform app
      'http://localhost:3004', // Platform app (alternate dev port)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inzertná Platforma API')
    .setDescription('API dokumentácia pre inzertnú platformu')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API server running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);

  const shutdown = async (signal: string) => {
    console.log(`\n${signal}: ukončujem API a odpájam Prisma…`);
    try {
      await app.close();
    } catch {
      /* ignore */
    }
    try {
      await prisma.$disconnect();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap();
