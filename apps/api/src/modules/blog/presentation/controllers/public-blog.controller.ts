import { Controller, Get, Param, Query, Res, UseFilters } from '@nestjs/common';
import type { Response } from 'express';

import { Public } from '../../../../common/decorators/public.decorator';
import { GenerateBlogRssUseCase } from '../../application/use-cases/generate-blog-rss.use-case';
import { GetPublishedPostUseCase } from '../../application/use-cases/get-published-post.use-case';
import { GetRelatedPostsUseCase } from '../../application/use-cases/get-related-posts.use-case';
import { ListBlogCategoriesUseCase } from '../../application/use-cases/list-blog-categories.use-case';
import { ListBlogTagsUseCase } from '../../application/use-cases/list-blog-tags.use-case';
import { ListPublishedPostsUseCase } from '../../application/use-cases/list-published-posts.use-case';
import { ListPublishedPostsQueryDto } from '../dto/list-published-posts-query.dto';
import { BlogExceptionFilter } from '../filters/blog-exception.filter';

/** Lecturas públicas del blog (spec 027 §6/§7): Blog Home, Category/Tag Archive (mismo endpoint con filtros, criterio de 014), Article Detail, contenido relacionado, categorías/etiquetas y RSS. */
@Controller('blog')
@Public()
@UseFilters(BlogExceptionFilter)
export class PublicBlogController {
  constructor(
    private readonly listPublishedPosts: ListPublishedPostsUseCase,
    private readonly getPublishedPost: GetPublishedPostUseCase,
    private readonly getRelatedPosts: GetRelatedPostsUseCase,
    private readonly listCategories: ListBlogCategoriesUseCase,
    private readonly listTags: ListBlogTagsUseCase,
    private readonly generateRss: GenerateBlogRssUseCase,
  ) {}

  @Get('posts')
  async listPosts(@Query() query: ListPublishedPostsQueryDto) {
    const result = await this.listPublishedPosts.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.category !== undefined ? { categorySlug: query.category } : {}),
      ...(query.tag !== undefined ? { tagSlug: query.tag } : {}),
    });
    return { ...result, items: result.items.map((post) => post.toJSON()) };
  }

  @Get('posts/:slug')
  async getPost(@Param('slug') slug: string) {
    return this.getPublishedPost.execute(slug);
  }

  @Get('posts/:slug/related')
  async related(@Param('slug') slug: string) {
    const posts = await this.getRelatedPosts.execute(slug);
    return posts.map((post) => post.toJSON());
  }

  @Get('categories')
  async categories() {
    const items = await this.listCategories.execute();
    return items.map((category) => category.toJSON());
  }

  @Get('tags')
  async tags() {
    const items = await this.listTags.execute();
    return items.map((tag) => tag.toJSON());
  }

  @Get('rss.xml')
  async rss(@Res() res: Response) {
    const xml = await this.generateRss.execute();
    res.type('application/rss+xml').send(xml);
  }
}
