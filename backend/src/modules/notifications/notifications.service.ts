import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationType } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { FirebaseProvider } from './firebase.provider';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly firebaseProvider: FirebaseProvider,
    private readonly configService: ConfigService,
  ) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    channels?: string[];
    entityUrl?: string;
  }) {
    const notification = this.notifRepo.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      channels: data.channels || ['in_app'],
      entityUrl: data.entityUrl,
    });

    const saved = await this.notifRepo.save(notification);

    if (data.channels?.includes('push')) {
      await this.sendPushNotification(data.userId, data.title, data.message, data.data);
    }

    return saved;
  }

  async createBulk(notifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    channels?: string[];
  }>) {
    const entities = notifications.map((n) =>
      this.notifRepo.create({
        ...n,
        channels: n.channels || ['in_app'],
      }),
    );

    const saved = await this.notifRepo.save(entities);

    const pushNotifications = notifications.filter((n) => n.channels?.includes('push'));
    for (const pn of pushNotifications) {
      await this.sendPushNotification(pn.userId, pn.title, pn.message, pn.data);
    }

    return saved;
  }

  async findAllAdmin(page = 1, limit = 50, unreadOnly?: boolean) {
    const qb = this.notifRepo.createQueryBuilder('n');

    if (unreadOnly) {
      qb.andWhere('n.isRead = false');
    }

    qb.orderBy('n.createdAt', 'DESC');

    const [notifications, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: notifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findAll(userId: string, page = 1, limit = 20, unreadOnly?: boolean) {
    const qb = this.notifRepo.createQueryBuilder('n')
      .where('n.userId = :userId', { userId });

    if (unreadOnly) {
      qb.andWhere('n.isRead = false');
    }

    qb.orderBy('n.createdAt', 'DESC');

    const [notifications, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: notifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAsRead(id: string, userId: string) {
    const notif = await this.notifRepo.findOne({ where: { id, userId } });
    if (!notif) throw new NotFoundException('Notification not found');

    notif.isRead = true;
    await this.notifRepo.save(notif);
    return { message: 'Marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.notifRepo.update({ userId, isRead: false }, { isRead: true });
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notifRepo.count({ where: { userId, isRead: false } });
    return { unreadCount: count };
  }

  private async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user?.preferences?.fcmToken) return;

      const messaging = this.firebaseProvider.getMessaging();
      if (!messaging) return;

      await messaging.send({
        token: user.preferences.fcmToken,
        notification: { title, body },
        data: data as Record<string, string>,
      });
    } catch (error: any) {
      this.logger.warn(`Push notification failed for user ${userId}: ${error.message}`);
    }
  }
}
