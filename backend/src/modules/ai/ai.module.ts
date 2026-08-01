import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiEngineService } from './ai-engine.service';
import { AiToolsService } from './ai-tools.service';
import { AiConversationService } from './ai-conversation.service';
import { Issue } from '../../database/entities/issue.entity';
import { Department } from '../../database/entities/department.entity';
import { Volunteer } from '../../database/entities/volunteer.entity';
import { EmergencyAlert } from '../../database/entities/emergency-alert.entity';
import { AiConversation } from '../../database/entities/ai-conversation.entity';
import { AiMessage } from '../../database/entities/ai-message.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Issue, Department, Volunteer, EmergencyAlert, AiConversation, AiMessage]),
    AuthModule,
    HttpModule.register({ timeout: 30000, maxRedirects: 5 }),
  ],
  controllers: [AiController],
  providers: [AiService, AiEngineService, AiToolsService, AiConversationService],
  exports: [AiService, AiEngineService, AiConversationService],
})
export class AiModule {}
