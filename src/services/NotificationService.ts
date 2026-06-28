export interface NotificationPayload {
  recipient: string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface INotificationProvider {
  name: string;
  supportedChannels: string[];
  send(channel: 'email' | 'sms' | 'teams' | 'whatsapp' | 'push', payload: NotificationPayload): Promise<boolean>;
}

export class MockEmailNotificationProvider implements INotificationProvider {
  public name = 'MockEmailProvider';
  public supportedChannels = ['email'];

  public async send(channel: string, payload: NotificationPayload): Promise<boolean> {
    console.log(`[Notification Engine] [${channel}] Outgoing payload addressed to ${payload.recipient}: ${payload.title} - ${payload.body}`);
    return true;
  }
}

/**
 * Centrally registered client alerts dispatcher. Pluggable notification engine.
 */
export class NotificationService {
  private static instance: NotificationService;
  private providers: INotificationProvider[] = [];

  private constructor() {
    this.providers.push(new MockEmailNotificationProvider());
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public registerProvider(provider: INotificationProvider): void {
    this.providers.push(provider);
  }

  public async dispatch(
    channel: 'email' | 'sms' | 'teams' | 'whatsapp' | 'push',
    payload: NotificationPayload
  ): Promise<boolean> {
    const handler = this.providers.find(p => p.supportedChannels.includes(channel));
    if (!handler) {
      console.warn(`[Notification Warning] No active pluggable provider found for channel: ${channel}`);
      return false;
    }
    return await handler.send(channel, payload);
  }
}
