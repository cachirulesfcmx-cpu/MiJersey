import type { MediaAssetStatus, MediaType } from '../value-objects/media-enums';
import type { AssetTagEntity } from './asset-tag.entity';

export interface MediaAssetProps {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  type: MediaType;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string | null;
  title: string | null;
  status: MediaAssetStatus;
  contentHash: string;
  storageKey: string;
  url: string;
  thumbnailUrl: string | null;
  folderId: string | null;
  tags: AssetTagEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class MediaAssetEntity {
  constructor(private readonly props: MediaAssetProps) {}

  get id(): string {
    return this.props.id;
  }

  get filename(): string {
    return this.props.filename;
  }

  get originalName(): string {
    return this.props.originalName;
  }

  get mimeType(): string {
    return this.props.mimeType;
  }

  get type(): MediaType {
    return this.props.type;
  }

  get size(): number {
    return this.props.size;
  }

  get width(): number | null {
    return this.props.width;
  }

  get height(): number | null {
    return this.props.height;
  }

  get duration(): number | null {
    return this.props.duration;
  }

  get altText(): string | null {
    return this.props.altText;
  }

  get title(): string | null {
    return this.props.title;
  }

  get status(): MediaAssetStatus {
    return this.props.status;
  }

  get contentHash(): string {
    return this.props.contentHash;
  }

  get storageKey(): string {
    return this.props.storageKey;
  }

  get url(): string {
    return this.props.url;
  }

  get thumbnailUrl(): string | null {
    return this.props.thumbnailUrl;
  }

  get folderId(): string | null {
    return this.props.folderId;
  }

  get tags(): AssetTagEntity[] {
    return this.props.tags;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Omit<MediaAssetProps, 'tags'> & { tags: ReturnType<AssetTagEntity['toJSON']>[] } {
    return { ...this.props, tags: this.props.tags.map((tag) => tag.toJSON()) };
  }
}
