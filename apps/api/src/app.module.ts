import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FacilitiesModule } from './modules/facilities/facilities.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OffersModule } from './modules/offers/offers.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PlansModule } from './modules/plans/plans.module';
import { WeatherModule } from './modules/weather/weather.module';
import { AdminModule } from './modules/admin/admin.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),

    DatabaseModule,
    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
    }),

    // Phase 1 — Foundation
    AuthModule,
    UsersModule,

    // Phase 2 — Booking Engine
    FacilitiesModule,
    BookingsModule,
    WaitlistModule,
    NotificationsModule,
    OffersModule,

    // Phase 3 — Analytics, Plans, Weather, Admin
    AnalyticsModule,
    PlansModule,
    WeatherModule,
    AdminModule,
  ],
})
export class AppModule {}
