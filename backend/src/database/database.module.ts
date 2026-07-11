import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Issue } from './entities/issue.entity';
import { IssueMedia } from './entities/issue-media.entity';
import { CommunityVerification } from './entities/community-verification.entity';
import { Department } from './entities/department.entity';
import { Notification } from './entities/notification.entity';
import { Volunteer } from './entities/volunteer.entity';
import { EmergencyAlert } from './entities/emergency-alert.entity';
import { IssueTimeline } from './entities/issue-timeline.entity';
import { Comment } from './entities/comment.entity';

const entities = [
  User,
  Issue,
  IssueMedia,
  CommunityVerification,
  Department,
  Notification,
  Volunteer,
  EmergencyAlert,
  IssueTimeline,
  Comment,
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'communityiq'),
        ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: configService.get<string>('DB_LOGGING') === 'true',
        entities,
        extra: {
          searchPath: 'public',
        },
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
