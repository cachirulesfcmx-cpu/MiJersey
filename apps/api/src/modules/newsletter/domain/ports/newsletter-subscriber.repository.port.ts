export interface NewsletterSubscriberRecord {
  id: string;
  email: string;
  source: string | null;
  createdAt: Date;
}

export interface CreateNewsletterSubscriberData {
  email: string;
  source: string | null;
  ipAddress: string | null;
}

export interface NewsletterSubscriberRepositoryPort {
  findByEmail(email: string): Promise<NewsletterSubscriberRecord | null>;
  create(data: CreateNewsletterSubscriberData): Promise<NewsletterSubscriberRecord>;
}
