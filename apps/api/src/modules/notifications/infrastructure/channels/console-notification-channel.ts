import { Logger } from '@nestjs/common';

import type {
  NotificationChannelPort,
  SendChannelMessageInput,
  SendChannelMessageResult,
} from '../../domain/ports/notification-channel.port';

/** Sin credenciales reales de Twilio/WhatsApp Business API/FCM en este entorno, SMS/WhatsApp/Push registran el mensaje en el log en vez de llamar a un proveedor externo — mismo comportamiento de desarrollo que `ConsoleMailer` (003) y `ConsoleTrackingDispatcher` (033). Conectar un proveedor real es implementar `NotificationChannelPort` contra su API sin tocar el resto del módulo. */
export class ConsoleNotificationChannel implements NotificationChannelPort {
  private readonly logger = new Logger(ConsoleNotificationChannel.name);

  constructor(private readonly channelLabel: string) {}

  async send(input: SendChannelMessageInput): Promise<SendChannelMessageResult> {
    this.logger.log(
      `[canal no conectado: ${this.channelLabel}] ${input.recipient} <- ${input.templateKey} ${JSON.stringify(input.payload)}`,
    );
    return Promise.resolve({
      delivered: false,
      raw: { channel: this.channelLabel, templateKey: input.templateKey },
    });
  }
}
