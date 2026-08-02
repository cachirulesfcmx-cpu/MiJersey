import type { TrackingProviderEntity } from '../entities/tracking-provider.entity';

export interface DispatchTrackingEventInput {
  provider: TrackingProviderEntity;
  eventName: string;
  payload: Record<string, unknown>;
}

export interface DispatchTrackingEventResult {
  delivered: boolean;
  raw: Record<string, unknown>;
}

/** Despachador de eventos (033 §5) — abstrae el envío real a cada plataforma (GA4/GTM/Meta/TikTok/Conversion API). Sin credenciales reales de terceros en este entorno, se implementa con un adaptador de consola (`ConsoleTrackingDispatcher`), mismo criterio que `ConsoleMailer` (003) y `ManualPaymentProvider` (022). */
export interface TrackingEventDispatcherPort {
  dispatch(input: DispatchTrackingEventInput): Promise<DispatchTrackingEventResult>;
}
