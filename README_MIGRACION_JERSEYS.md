# Migracion de jerseys legacy

Este paquete importa el export MySQL de jerseys al esquema PostgreSQL/Prisma de MiJersey.

## Contenido esperado

```txt
legacy/
  jerseys_catalog.sql
  public/assets/jerseys/products/*.webp
tools/
  import-legacy-jerseys.mjs
```

## Donde ejecutarlo

Ejecutalo desde la raiz del repo MiJersey, en una computadora que ya tenga:

- dependencias instaladas con `pnpm install`
- PostgreSQL y Redis funcionando
- `apps/api/.env` apuntando a la base PostgreSQL correcta
- migraciones del sistema aplicadas con `pnpm prisma:migrate`
- Prisma Client generado con `pnpm prisma:generate`

## Verificar sin importar

```bash
node tools/import-legacy-jerseys.mjs --sql legacy/jerseys_catalog.sql --assets legacy/public/assets --dry-run
```

## Importar

```bash
node tools/import-legacy-jerseys.mjs --sql legacy/jerseys_catalog.sql --assets legacy/public/assets
```

Por defecto el script:

- crea/actualiza la categoria `jerseys`
- crea/actualiza la marca `Bart Jerseys`
- importa productos como `ACTIVE` y `PUBLIC` si `active = 1`
- crea metadata SEO para cada producto
- copia imagenes a `apps/api/uploads/legacy-jerseys/products`
- crea registros en `media_assets`, `media_asset_usages` y `product_media`
- crea opciones por producto: `Talla`, `Dorsal`, `Version`
- crea variantes normalizadas en `product_variants`
- crea inventario en un almacen `LEGACY`

## Reimportar

El importador es idempotente por SKU, slug, hash de archivo y claves unicas del sistema. Si algo queda a medias, se puede volver a correr.
