import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommunityVerification } from '../../database/entities/community-verification.entity';
import { Issue } from '../../database/entities/issue.entity';
import { Comment } from '../../database/entities/comment.entity';
import { Volunteer } from '../../database/entities/volunteer.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommunityVerification, Issue, Comment, Volunteer]),
    AuthModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
