export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailTransportPort {
  send(input: SendEmailInput): Promise<void>;
}
