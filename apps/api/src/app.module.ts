import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { ConfigModule } from './config/config.module';
import { APP_CONFIG } from './config/env.config';
import type { AppConfig } from './config/env.schema';
import { HealthModule } from './health/health.module';
import { AdministrationModule } from './modules/administration/administration.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { BlogModule } from './modules/blog/blog.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CartModule } from './modules/cart/cart.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { CmsModule } from './modules/cms/cms.module';
import { CustomerModule } from './modules/customer/customer.module';
import { EmailTemplatesModule } from './modules/email-templates/email-templates.module';
import { HomeModule } from './modules/home/home.module';
import { IdentityModule } from './modules/identity/identity.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MediaModule } from './modules/media/media.module';
import { NavigationModule } from './modules/navigation/navigation.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { SearchModule } from './modules/search/search.module';
import { SeoModule } from './modules/seo/seo.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { SiteConfigModule } from './modules/site-config/site-config.module';
import { SupportModule } from './modules/support/support.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { ThemeModule } from './modules/theme/theme.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.logLevel,
          // 03-CODING-STANDARDS.md §11: nunca registrar tokens/secretos.
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers["x-api-key"]',
              'res.headers["set-cookie"]',
            ],
            censor: '[REDACTED]',
          },
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const existing = req.headers['x-request-id'];
            const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          ...(config.isProduction
            ? {}
            : { transport: { target: 'pino-pretty', options: { singleLine: true } } }),
        },
      }),
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    IdentityModule,
    AttributesModule,
    CartModule,
    CheckoutModule,
    CustomerModule,
    CatalogModule,
    TaxonomyModule,
    InventoryModule,
    MediaModule,
    BrandsModule,
    SeoModule,
    HomeModule,
    SearchModule,
    AdministrationModule,
    WishlistModule,
    OrdersModule,
    PaymentsModule,
    PromotionsModule,
    ShippingModule,
    SupportModule,
    CmsModule,
    BlogModule,
    NavigationModule,
    ThemeModule,
    SiteConfigModule,
    EmailTemplatesModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
