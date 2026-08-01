import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import { POST_REPOSITORY } from '../../blog.constants';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';

const RSS_ITEM_LIMIT = 30;

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** RSS de los artículos publicados más recientes (spec §9 "RSS") — sin caché propia: se apoya en el listado ya publicado, que a su vez promueve `SCHEDULED` vencidos antes de responder. */
@Injectable()
export class GenerateBlogRssUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(): Promise<string> {
    await this.posts.promoteDuePosts(new Date());

    const { items } = await this.posts.findManyPublished({ page: 1, pageSize: RSS_ITEM_LIMIT });
    const baseUrl = this.config.publicWebUrl.replace(/\/$/, '');
    const channelUrl = `${baseUrl}/blog`;

    const itemsXml = items
      .map((post) => {
        const json = post.toJSON();
        const link = `${baseUrl}/blog/${json.slug}`;
        const pubDate = (json.publishedAt ?? json.createdAt).toUTCString();
        return [
          '  <item>',
          `    <title>${escapeXml(json.title)}</title>`,
          `    <link>${escapeXml(link)}</link>`,
          `    <guid>${escapeXml(link)}</guid>`,
          `    <pubDate>${pubDate}</pubDate>`,
          json.excerpt ? `    <description>${escapeXml(json.excerpt)}</description>` : undefined,
          '  </item>',
        ]
          .filter((line): line is string => line !== undefined)
          .join('\n');
      })
      .join('\n');

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      '<channel>',
      '  <title>MiJersey Blog</title>',
      `  <link>${escapeXml(channelUrl)}</link>`,
      '  <description>Artículos de MiJersey</description>',
      itemsXml,
      '</channel>',
      '</rss>',
      '',
    ].join('\n');
  }
}
