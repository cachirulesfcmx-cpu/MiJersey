import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { BlogCacheService } from './application/services/blog-cache.service';
import { CreateBlogCategoryUseCase } from './application/use-cases/create-blog-category.use-case';
import { CreateBlogTagUseCase } from './application/use-cases/create-blog-tag.use-case';
import { CreatePostUseCase } from './application/use-cases/create-post.use-case';
import { DeleteBlogCategoryUseCase } from './application/use-cases/delete-blog-category.use-case';
import { DeleteBlogTagUseCase } from './application/use-cases/delete-blog-tag.use-case';
import { DeletePostUseCase } from './application/use-cases/delete-post.use-case';
import { GenerateBlogRssUseCase } from './application/use-cases/generate-blog-rss.use-case';
import { GetPostUseCase } from './application/use-cases/get-post.use-case';
import { GetPublishedPostUseCase } from './application/use-cases/get-published-post.use-case';
import { GetRelatedPostsUseCase } from './application/use-cases/get-related-posts.use-case';
import { ListBlogCategoriesUseCase } from './application/use-cases/list-blog-categories.use-case';
import { ListBlogTagsUseCase } from './application/use-cases/list-blog-tags.use-case';
import { ListPostVersionsUseCase } from './application/use-cases/list-post-versions.use-case';
import { ListPostsUseCase } from './application/use-cases/list-posts.use-case';
import { ListPublishedPostsUseCase } from './application/use-cases/list-published-posts.use-case';
import { PublishPostUseCase } from './application/use-cases/publish-post.use-case';
import { RestorePostVersionUseCase } from './application/use-cases/restore-post-version.use-case';
import { UpdateBlogCategoryUseCase } from './application/use-cases/update-blog-category.use-case';
import { UpdateBlogTagUseCase } from './application/use-cases/update-blog-tag.use-case';
import { UpdatePostUseCase } from './application/use-cases/update-post.use-case';
import {
  BLOG_CATEGORY_REPOSITORY,
  BLOG_TAG_REPOSITORY,
  POST_REPOSITORY,
  POST_VERSION_REPOSITORY,
} from './blog.constants';
import { PrismaBlogCategoryRepository } from './infrastructure/persistence/prisma-blog-category.repository';
import { PrismaBlogTagRepository } from './infrastructure/persistence/prisma-blog-tag.repository';
import { PrismaPostRepository } from './infrastructure/persistence/prisma-post.repository';
import { PrismaPostVersionRepository } from './infrastructure/persistence/prisma-post-version.repository';
import { AdminBlogPostsController } from './presentation/controllers/admin-blog-posts.controller';
import { AdminBlogTaxonomyController } from './presentation/controllers/admin-blog-taxonomy.controller';
import { PublicBlogController } from './presentation/controllers/public-blog.controller';

@Module({
  imports: [IdentityModule],
  controllers: [AdminBlogPostsController, AdminBlogTaxonomyController, PublicBlogController],
  providers: [
    BlogCacheService,
    CreatePostUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,
    GetPostUseCase,
    ListPostsUseCase,
    PublishPostUseCase,
    GetPublishedPostUseCase,
    ListPublishedPostsUseCase,
    GetRelatedPostsUseCase,
    ListPostVersionsUseCase,
    RestorePostVersionUseCase,
    GenerateBlogRssUseCase,
    ListBlogCategoriesUseCase,
    CreateBlogCategoryUseCase,
    UpdateBlogCategoryUseCase,
    DeleteBlogCategoryUseCase,
    ListBlogTagsUseCase,
    CreateBlogTagUseCase,
    UpdateBlogTagUseCase,
    DeleteBlogTagUseCase,
    { provide: POST_REPOSITORY, useClass: PrismaPostRepository },
    { provide: POST_VERSION_REPOSITORY, useClass: PrismaPostVersionRepository },
    { provide: BLOG_CATEGORY_REPOSITORY, useClass: PrismaBlogCategoryRepository },
    { provide: BLOG_TAG_REPOSITORY, useClass: PrismaBlogTagRepository },
  ],
})
export class BlogModule {}
