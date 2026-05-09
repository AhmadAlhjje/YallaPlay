import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RolesGuard } from './modules/auth/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS — tighten in production
  app.enableCors({
    origin: process.env.NODE_ENV === 'development'
      ? true  // Mirror request origin in dev (works for Expo Go on any IP)
      : [process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3001'],
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
