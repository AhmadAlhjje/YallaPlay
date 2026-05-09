import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Notification,
  NotificationDocument,
} from '../../database/schemas/notification.mongoose-schema';
import { User, UserDocument } from '../../database/schemas/user.mongoose-schema';
import { NotificationType } from '@yallaplay/shared-types';

interface SendPushPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: any; // firebase-admin App

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private config: ConfigService,
  ) {
    this.initFirebase();
  }

  private initFirebase(): void {
    const projectId = this.config.get('FIREBASE_PROJECT_ID');
    if (!projectId) {
      this.logger.warn('Firebase not configured — push notifications disabled (dev mode)');
      return;
    }

    try {
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: this.config.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
            clientEmail: this.config.get('FIREBASE_CLIENT_EMAIL'),
          }),
        });
      } else {
        this.firebaseApp = admin.apps[0];
      }
    } catch (error) {
      this.logger.error('Firebase init failed:', error);
    }
  }

  async sendPush(payload: SendPushPayload): Promise<void> {
    // 1. Store in-app notification (always, even without FCM)
    await this.notificationModel.create({
      userId: new Types.ObjectId(payload.userId),
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sentAt: new Date(),
    });

    // 2. Get device tokens
    const user = await this.userModel
      .findById(payload.userId)
      .select('deviceTokens')
      .lean();

    if (!user?.deviceTokens?.length || !this.firebaseApp) {
      this.logger.debug(`[PUSH MOCK] To: ${payload.userId} | ${payload.title}: ${payload.body}`);
      return;
    }

    // 3. Send via FCM — batch to all registered devices
    const admin = require('firebase-admin');
    const messaging = admin.messaging(this.firebaseApp);

    const message = {
      notification: { title: payload.title, body: payload.body },
      data: this.stringifyData(payload.data ?? {}),
      tokens: user.deviceTokens,
    };

    try {
      const response = await messaging.sendEachForMulticast(message);

      // Clean up stale tokens that FCM rejected
      const staleTokens = user.deviceTokens.filter(
        (_token: string, idx: number) =>
          response.responses[idx]?.error?.code === 'messaging/registration-token-not-registered',
      );

      if (staleTokens.length > 0) {
        await this.userModel.updateOne(
          { _id: payload.userId },
          { $pull: { deviceTokens: { $in: staleTokens } } },
        );
      }

      this.logger.log(
        `Push sent: ${response.successCount} success, ${response.failureCount} failed`,
      );
    } catch (error) {
      this.logger.error('FCM send failed:', error);
    }
  }

  async getInbox(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments({ userId: new Types.ObjectId(userId) }),
      this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true } },
    );
  }

  async markOneRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: notificationId, userId: new Types.ObjectId(userId) },
      { $set: { isRead: true } },
    );
  }

  private stringifyData(data: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)]),
    );
  }
}
