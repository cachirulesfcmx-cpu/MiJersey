export class SiteConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidSiteConfigurationError extends SiteConfigError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidSystemSettingError extends SiteConfigError {
  constructor(message: string) {
    super(message);
  }
}
