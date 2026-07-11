import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GisController } from './gis.controller';
import { GisService } from './gis.service';
import { Issue } from '../../database/entities/issue.entity';
import { EmergencyAlert } from '../../database/entities/emergency-alert.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Issue, EmergencyAlert]), AuthModule],
  controllers: [GisController],
  providers: [GisService],
  exports: [GisService],
})
export class GisModule {}
