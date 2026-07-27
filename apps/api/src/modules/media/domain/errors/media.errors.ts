export class MediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class MediaAssetNotFoundError extends MediaError {
  constructor() {
    super('Archivo no encontrado');
  }
}

export class UnsupportedMediaTypeError extends MediaError {
  constructor(mimeType: string) {
    super(`Tipo de archivo no soportado: ${mimeType}`);
  }
}

export class MediaAssetInUseError extends MediaError {
  constructor() {
    super('No se puede eliminar un archivo que está referenciado en otro lugar');
  }
}

export class FolderNotFoundError extends MediaError {
  constructor() {
    super('Carpeta no encontrada');
  }
}

export class FolderSlugAlreadyExistsError extends MediaError {
  constructor() {
    super('Ya existe una carpeta con ese slug');
  }
}

export class FolderCycleError extends MediaError {
  constructor() {
    super('Una carpeta no puede ser su propio ancestro');
  }
}

export class FolderNotEmptyError extends MediaError {
  constructor() {
    super('No se puede eliminar una carpeta que tiene subcarpetas o archivos');
  }
}

export class InvalidUploadError extends MediaError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidSlugError extends MediaError {
  constructor(raw: string) {
    super(`Slug inválido: ${raw}`);
  }
}

export class AssetTagNotFoundError extends MediaError {
  constructor() {
    super('Etiqueta no encontrada');
  }
}
