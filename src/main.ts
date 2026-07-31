import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import * as express from 'express';
import { json, urlencoded } from 'express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS securely
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:42001',
      'http://localhost:3005',
      'http://localhost:42003',
      'http://localhost:42005',
      'http://localhost:42006',
      'http://localhost:3004',
      'http://localhost:3013',
      'http://localhost:3001',
      'http://localhost:3003',
      'https://cutecares.com',
      'https://pos.cutecares.com',
      'https://cutecares.com',
      'https://www.cutecares.com',
      'https://admin.cutecares.com',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    credentials: process.env.PRODUCTION_BUILD === 'true',
  });

  // Enable security headers
  // app.use(helmet());

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Limit payload size
  app.use(json({ 
    limit: '50mb',
    verify: (req: any, res, buf) => {
      if (req.originalUrl.includes('webhook-stripe')) {
        req.rawBody = buf;
      }
    }
  }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.use(
    '/upload/static',
    express.static(join(__dirname, '..', 'upload/static')),
  );

  // Global prefix for API routes
  if (process.env.PREFIX) {
    app.setGlobalPrefix(process.env.PREFIX);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
bootstrap();
