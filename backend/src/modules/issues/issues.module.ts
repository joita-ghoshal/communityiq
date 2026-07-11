import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { Issue } from '../../database/entities/issue.entity';
import { IssueMedia } from '../../database/entities/issue-media.entity';
import { IssueTimeline } from '../../database/entities/issue-timeline.entity';
import { Comment } from '../../database/entities/comment.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, IssueMedia, IssueTimeline, Comment]),
    AuthModule,
  ],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService],
})
export class IssuesModule {}
