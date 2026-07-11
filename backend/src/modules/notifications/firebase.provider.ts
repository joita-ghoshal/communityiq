import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseProvider {
  private readonly logger = new Logger(FirebaseProvider.name);
  private app: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private initialize() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn('Firebase credentials not configured. Push notifications disabled.');
        return;
      }

      if (admin.apps.length > 0) {
        this.app = admin.apps[0];
        return;
      }

      this.app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
        }),
      });

      this.logger.log('Firebase initialized successfully');
    } catch (error: any) {
      this.logger.error(`Firebase initialization failed: ${error.message}`);
    }
  }

  getMessaging(): admin.messaging.Messaging | null {
    return this.app?.messaging() || null;
  }

  getApp(): admin.app.App | null {
    return this.app;
  }
}
