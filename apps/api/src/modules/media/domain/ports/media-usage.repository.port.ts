export interface MediaAssetUsageRecord {
  id: string;
  mediaAssetId: string;
  referenceType: string;
  referenceId: string;
  createdAt: Date;
}

/**
 * Rastreo genérico de uso (spec §5 "mantener historial de uso"): otros módulos
 * (p. ej. Brands en 011) registran/quitan referencias sin que Media Library
 * conozca su modelo de dominio, vía (referenceType, referenceId).
 */
export interface MediaAssetUsageRepositoryPort {
  record(mediaAssetId: string, referenceType: string, referenceId: string): Promise<void>;
  remove(mediaAssetId: string, referenceType: string, referenceId: string): Promise<void>;
  countByAsset(mediaAssetId: string): Promise<number>;
  findByAsset(mediaAssetId: string): Promise<MediaAssetUsageRecord[]>;
}
