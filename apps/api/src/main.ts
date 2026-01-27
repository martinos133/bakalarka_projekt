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
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Zvýšenie limitu pre veľkosť request body (pre obrázky v base64)
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
}

bootstrap();
