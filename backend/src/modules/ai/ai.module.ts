import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { Issue } from '../../database/entities/issue.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Issue]), AuthModule, HttpModule.register({ timeout: 30000, maxRedirects: 5 })],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
