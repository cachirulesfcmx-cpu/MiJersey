export interface SubscribeToNewsletterInput {
  email: string;
  source?: string;
}

export interface SubscribeToNewsletterResult {
  subscribed: boolean;
  alreadySubscribed: boolean;
}
