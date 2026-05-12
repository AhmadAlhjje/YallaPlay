import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
  Browsers,
  type WASocket,
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private socket?: WASocket;
  private isReady = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECTS = 5;

  constructor(private config: ConfigService) {}

  get ready(): boolean {
    return this.isReady;
  }

  async onModuleInit(): Promise<void> {
    const provider = this.config.get('SMS_PROVIDER', 'console');
    if (provider !== 'whatsapp') return;
    await this.connect();
  }

  private async connect(): Promise<void> {
    try {
      const authDir = this.config.get('WHATSAPP_AUTH_DIR', '.wa_session');
      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      const { version } = await fetchLatestBaileysVersion();

      this.socket = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        logger: require('pino')({ level: 'silent' }) as any,
        browser: Browsers.ubuntu('Chrome'),
        keepAliveIntervalMs: 25_000,
        connectTimeoutMs: 60_000,
        defaultQueryTimeoutMs: 60_000,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        retryRequestDelayMs: 500,
      });

      this.socket.ev.on('creds.update', saveCreds);

      this.socket.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
          this.logger.warn('══════════════════════════════════════════════════════');
          this.logger.warn('  ⚠️  WhatsApp غير مرتبط — امسح هذا QR بهاتفك الآن  ');
          this.logger.warn('══════════════════════════════════════════════════════');
          qrcode.generate(qr, { small: true });
          this.logger.warn('══════════════════════════════════════════════════════');
        }

        if (connection === 'open') {
          this.isReady = true;
          this.reconnectAttempts = 0;
          this.logger.log('══════════════════════════════════════════════════════');
          this.logger.log('  ✅ WhatsApp متصل وجاهز لإرسال رسائل OTP             ');
          this.logger.log('══════════════════════════════════════════════════════');
        }

        if (connection === 'close') {
          this.isReady = false;
          const err = (lastDisconnect as any)?.error;
          const statusCode = err?.output?.statusCode ?? err?.output?.payload?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const isRestarting = statusCode === DisconnectReason.restartRequired;

          if (isLoggedOut) {
            this.logger.error('WhatsApp: تم تسجيل الخروج. احذف مجلد .wa_session وأعد تشغيل الخادم لمسح QR جديد.');
            return;
          }

          if (this.reconnectAttempts < this.MAX_RECONNECTS) {
            this.reconnectAttempts++;
            // Shorter delay on restart-required to reconnect fast
            const delay = isRestarting ? 1000 : Math.min(3000 * this.reconnectAttempts, 30_000);
            this.logger.warn(`WhatsApp: انقطع الاتصال (${statusCode ?? 'unknown'}). إعادة المحاولة ${this.reconnectAttempts}/${this.MAX_RECONNECTS} بعد ${delay}ms`);
            setTimeout(() => void this.connect(), delay);
          } else {
            this.logger.error('WhatsApp: فشلت جميع محاولات إعادة الاتصال. احذف مجلد .wa_session وأعد تشغيل الخادم.');
            this.reconnectAttempts = 0;
          }
        }
      });
    } catch (err) {
      this.logger.error('WhatsApp: خطأ أثناء الاتصال:', err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      this.isReady = false;
      // end() closes the connection without invalidating the session (logout() would delete credentials)
      await this.socket?.end(undefined);
    } catch {
      // Best-effort shutdown
    }
  }

  async sendOtp(phone: string, otp: string): Promise<void> {
    if (!this.socket || !this.isReady) {
      throw new ServiceUnavailableException(
        'خدمة WhatsApp غير متصلة. تحقق من terminal الخادم ومسح QR Code إن لم يتم ذلك.',
      );
    }

    const to = this.toJid(phone);
    const message = `🔐 رمز التحقق الخاص بك في يلا بلاي:\n\n*${otp}*\n\nصالح لمدة 5 دقائق. لا تشاركه مع أحد.`;
    await this.socket.sendMessage(to, { text: message });
    this.logger.log(`OTP sent via WhatsApp to ${phone}`);
  }

  private toJid(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return `${digits}@s.whatsapp.net`;
  }
}
