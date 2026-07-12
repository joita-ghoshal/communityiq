import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, string[]>();

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub || payload.id;
      if (!userId) { client.disconnect(); return; }

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user || !user.isActive) { client.disconnect(); return; }

      client.data.userId = userId;
      client.data.role = user.role;
      client.join(`user:${userId}`);

      if (user.role === 'super_admin' || user.role === 'municipal_admin') {
        client.join('admins');
      }
      client.join('all');

      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);

      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
      client.emit('connected', { userId, message: 'Connected to real-time notifications' });
    } catch (e) {
      this.logger.warn(`Connection failed: ${e.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      this.userSockets.set(userId, sockets.filter(id => id !== client.id));
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  sendNotificationToAdmins(notification: any) {
    this.server.to('admins').emit('notification', notification);
  }

  broadcastToAll(event: string, data: any) {
    this.server.to('all').emit(event, data);
  }

  sendIssueUpdate(issueId: string, data: any) {
    this.server.to('all').emit('issue:update', { issueId, ...data });
  }

  sendEmergencyAlert(alert: any) {
    this.server.to('all').emit('emergency:alert', alert);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('join:issue')
  handleJoinIssue(@ConnectedSocket() client: Socket, @MessageBody() data: { issueId: string }) {
    client.join(`issue:${data.issueId}`);
  }

  @SubscribeMessage('leave:issue')
  handleLeaveIssue(@ConnectedSocket() client: Socket, @MessageBody() data: { issueId: string }) {
    client.leave(`issue:${data.issueId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { issueId: string }) {
    client.to(`issue:${data.issueId}`).emit('user:typing', { userId: client.data.userId, issueId: data.issueId });
  }
}
