export class ProviderConfigError extends Error {
  constructor(provider: string) {
    super(`No API key configured for provider: ${provider}`);
    this.name = "ProviderConfigError";
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ResourceNotFoundError extends Error {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`);
    this.name = "ResourceNotFoundError";
  }
}
