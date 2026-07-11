import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { IssuesModule } from './modules/issues/issues.module';
import { AiModule } from './modules/ai/ai.module';
import { CommunityModule } from './modules/community/community.module';
import { GisModule } from './modules/gis/gis.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmergencyModule } from './modules/emergency/emergency.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { VolunteersModule } from './modules/volunteers/volunteers.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { aiConfig } from './config/ai.config';
import { awsConfig } from './config/aws.config';
import { firebaseConfig } from './config/firebase.config';
import { elasticsearchConfig } from './config/elasticsearch.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, aiConfig, awsConfig, firebaseConfig, elasticsearchConfig],
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: 60,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    forwardRef(() => UsersModule),
    forwardRef(() => IssuesModule),
    AiModule,
    CommunityModule,
    GisModule,
    NotificationsModule,
    EmergencyModule,
    AnalyticsModule,
    VolunteersModule,
    UploadModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
