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
