export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface BlogAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface BlogTerm {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  status: PostStatus;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  author: BlogAuthor;
  categories: BlogTerm[];
  tags: BlogTerm[];
  createdAt: string;
  updatedAt: string;
}

export interface PostVersion {
  id: string;
  postId: string;
  versionNumber: number;
  snapshot: {
    title: string;
    slug: string;
    status: PostStatus;
    excerpt: string | null;
    content: string;
    featuredImage: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    categoryIds: string[];
    tagIds: string[];
  };
  createdAt: string;
}

export interface CreatePostInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  authorId: string;
  seoTitle?: string;
  seoDescription?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface UpdatePostInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface PublishPostInput {
  publishAt?: string;
}

export interface ListPostsParams {
  page?: number;
  pageSize?: number;
  status?: PostStatus;
}

export interface ListPublishedPostsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface CreateBlogCategoryInput {
  name: string;
  slug: string;
}

export type UpdateBlogCategoryInput = Partial<CreateBlogCategoryInput>;

export interface CreateBlogTagInput {
  name: string;
  slug: string;
}

export type UpdateBlogTagInput = Partial<CreateBlogTagInput>;
