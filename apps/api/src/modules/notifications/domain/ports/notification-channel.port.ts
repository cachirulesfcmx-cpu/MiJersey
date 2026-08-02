export interface SendChannelMessageInput {
  recipient: string;
  templateKey: string;
  payload: Record<string, unknown>;
}

export interface SendChannelMessageResult {
  delivered: boolean;
  raw: Record<string, unknown>;
}

/** Gestor de canales (034 §5) — un puerto por canal (`EMAIL`/`SMS`/`WHATSAPP`/`PUSH`); `EmailNotificationChannel` integra de verdad con Email Templates (031), el resto son adaptadores de consola sin credenciales reales en este entorno (mismo criterio que `ConsoleMailer`/`ConsoleTrackingDispatcher`). */
export interface NotificationChannelPort {
  send(input: SendChannelMessageInput): Promise<SendChannelMessageResult>;
}
