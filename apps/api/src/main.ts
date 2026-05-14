import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RolesGuard } from './modules/auth/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    bodyParser: false, // Disable built-in parser so our custom limit applies first
  });

  // Must be registered before any route handlers
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ extended: true, limit: '10mb' }));

  // Serve uploaded files publicly (QR images, etc.)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS — mobile apps don't need CORS, web builds do
  app.enableCors({
    origin: true,   // Allow all origins (mobile apps bypass CORS anyway)
    credentials: true,
  });

  // Global exception handler — returns Arabic-friendly errors
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Wrap all successful responses in { success, data, timestamp }
  app.useGlobalInterceptors(new TransformInterceptor());

  // Roles guard available globally
  app.useGlobalGuards(new RolesGuard(app.get(Reflector)));

  // Swagger — development only
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('YallaPlay API')
      .setDescription('منصة حجز الملاعب الرياضية')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    console.log(`📖 Swagger docs: http://localhost:${process.env.PORT || 3000}/api/docs`);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 YallaPlay API running on http://localhost:${port}/api/v1`);
}

bootstrap();
