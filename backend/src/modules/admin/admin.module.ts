import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { LeaveRequestService } from './leave-request.service';
import { User } from '../../database/entities/user.entity';
import { Department } from '../../database/entities/department.entity';
import { LeaveRequest } from '../../database/entities/leave-request.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Department, LeaveRequest]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, LeaveRequestService],
  exports: [AdminService, LeaveRequestService],
})
export class AdminModule {}
