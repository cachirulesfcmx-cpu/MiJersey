import type { PostStatus } from '../value-objects/post-enums';

/** Snapshot completo (mismo criterio que `PageSnapshot` de 026): reconstruye el artículo entero, incluidas sus asignaciones de categorías/etiquetas por id, para poder restaurarlo. `status` se conserva solo con fines informativos — restaurar nunca cambia la publicación vigente (`UpdatePostData` no tiene `status`). */
export interface PostSnapshot {
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
}

export interface PostVersionProps {
  id: string;
  postId: string;
  versionNumber: number;
  snapshot: PostSnapshot;
  createdAt: Date;
}

export class PostVersionEntity {
  constructor(private readonly props: PostVersionProps) {}

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get snapshot(): PostSnapshot {
    return this.props.snapshot;
  }

  toJSON(): PostVersionProps {
    return { ...this.props };
  }
}
