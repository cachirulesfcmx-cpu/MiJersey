import { Injectable, Logger } from '@nestjs/common';

import type {
  DispatchTrackingEventInput,
  DispatchTrackingEventResult,
  TrackingEventDispatcherPort,
} from '../../domain/ports/tracking-event-dispatcher.port';

/** Sin credenciales reales de GA4/GTM/Meta/TikTok en este entorno, registra el evento en el log en vez de llamar a la API del proveedor — mismo comportamiento de desarrollo que `ConsoleMailer` (003) y `ManualPaymentProvider` (022). Conectar un proveedor real implica implementar este puerto contra su SDK/API (ej. Measurement Protocol de GA4, Conversions API de Meta) sin tocar el resto del módulo. */
@Injectable()
export class ConsoleTrackingDispatcher implements TrackingEventDispatcherPort {
  private readonly logger = new Logger(ConsoleTrackingDispatcher.name);

  async dispatch(input: DispatchTrackingEventInput): Promise<DispatchTrackingEventResult> {
    this.logger.log(
      `[proveedor no conectado] ${input.provider.provider} <- ${input.eventName} ${JSON.stringify(input.payload)}`,
    );
    return Promise.resolve({
      delivered: false,
      raw: { provider: input.provider.provider, eventName: input.eventName },
    });
  }
}
