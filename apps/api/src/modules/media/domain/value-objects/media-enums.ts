export enum MediaAssetStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
]);
const VIDEO_MIME_TYPES = new Set(['video/mp4']);
const DOCUMENT_MIME_TYPES = new Set(['application/pdf']);

/** Deriva el `MediaType` a partir del mime type — así se pueden incorporar nuevos formatos ampliando estos sets (spec §4). `undefined` si no está soportado. */
export function mediaTypeFromMimeType(mimeType: string): MediaType | undefined {
  if (IMAGE_MIME_TYPES.has(mimeType)) return MediaType.IMAGE;
  if (VIDEO_MIME_TYPES.has(mimeType)) return MediaType.VIDEO;
  if (DOCUMENT_MIME_TYPES.has(mimeType)) return MediaType.DOCUMENT;
  return undefined;
}

export const SUPPORTED_MIME_TYPES = new Set([
  ...IMAGE_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
]);

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'application/pdf': '.pdf',
};

/** Extensión de archivo a partir del mime type — usada cuando el nombre original no trae una. */
export function extensionForMimeType(mimeType: string): string {
  return MIME_EXTENSIONS[mimeType] ?? '';
}
