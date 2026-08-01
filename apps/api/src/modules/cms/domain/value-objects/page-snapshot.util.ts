import type { PageEntity } from '../entities/page.entity';
import type { PageSnapshot } from '../entities/page-version.entity';

/** Convierte el estado actual de una página en el JSON completo que respalda una `PageVersion` — necesario para poder reconstruir el árbol de bloques al restaurar (spec §4). */
export function toPageSnapshot(page: PageEntity): PageSnapshot {
  const json = page.toJSON();
  return {
    title: json.title,
    slug: json.slug,
    status: json.status,
    template: json.template,
    seoTitle: json.seoTitle,
    seoDescription: json.seoDescription,
    blocks: json.blocks.map((block) => ({
      type: block.type,
      position: block.position,
      config: block.config,
    })),
  };
}
