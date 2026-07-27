export interface StoredFile {
  storageKey: string;
  url: string;
}

/**
 * Almacenamiento desacoplado (spec §7 "almacenamiento desacoplado"): los casos
 * de uso nunca tocan el sistema de archivos directamente. `LocalDiskStorageAdapter`
 * es la única implementación hoy; un adaptador de S3/objeto remoto se conecta
 * sin cambiar ningún caso de uso.
 */
export interface StoragePort {
  save(buffer: Buffer, extension: string): Promise<StoredFile>;
  delete(storageKey: string): Promise<void>;
  /** Ruta absoluta en disco para un `storageKey` — solo la usa `MediaProcessingService` para leer el archivo recién guardado. */
  resolvePath(storageKey: string): string;
}
