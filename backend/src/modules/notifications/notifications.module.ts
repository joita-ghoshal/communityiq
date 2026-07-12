import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationHelperService } from './notification-helper.service';
import { NotificationsGateway } from './notifications.gateway';
import { FirebaseProvider } from './firebase.provider';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { Issue } from '../../database/entities/issue.entity';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Issue]), AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationHelperService, FirebaseProvider, NotificationsGateway],
  exports: [NotificationsService, NotificationHelperService, NotificationsGateway],
})
export class NotificationsModule {}
