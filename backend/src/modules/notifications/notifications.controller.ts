import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import { NotificationType } from '../../database/entities/notification.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.findAll(userId, page, limit, unreadOnly);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN)
  @ApiOperation({ summary: 'Get all notifications (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async findAllAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.findAllAdmin(page, limit, unreadOnly);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MUNICIPAL_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and send a notification (admin only)' })
  async createNotification(
    @Body() body: { userId?: string; broadcast?: boolean; type?: string; title: string; message: string; data?: Record<string, any> },
  ) {
    if (body.broadcast || !body.userId) {
      const users = await this.userRepo.find({ where: { isActive: true } });
      const results = [];
      for (const user of users) {
        const r = await this.notificationsService.create({
          userId: user.id,
          type: (body.type as NotificationType) || NotificationType.SYSTEM,
          title: body.title,
          message: body.message,
          data: body.data,
        });
        results.push(r);
      }
      return { message: `Notification sent to ${users.length} users`, count: users.length };
    }
    return this.notificationsService.create({
      userId: body.userId,
      type: (body.type as NotificationType) || NotificationType.SYSTEM,
      title: body.title,
      message: body.message,
      data: body.data,
    });
  }
}
