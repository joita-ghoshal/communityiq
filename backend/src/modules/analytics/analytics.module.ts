import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Issue } from '../../database/entities/issue.entity';
import { User } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';
import { Volunteer } from '../../database/entities/volunteer.entity';
import { IssueTimeline } from '../../database/entities/issue-timeline.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Issue, User, Department, Volunteer, IssueTimeline]), AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
