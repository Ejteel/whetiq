import type { Provider } from "@mvp/core";
import type { ProviderAccount, Repository } from "@mvp/storage";
import type { KeychainClient } from "./keychain.js";

export class ProviderAccountService {
  constructor(
    private readonly repository: Repository,
    private readonly keychain: KeychainClient
  ) {}

  async connectProvider(provider: Provider, apiKey: string, configJson: Record<string, unknown> = {}): Promise<ProviderAccount> {
    const id = crypto.randomUUID();
    const keychainRef = `provider:${provider}:${id}`;
    await this.keychain.setSecret(keychainRef, apiKey);

    const now = new Date().toISOString();
    const account: ProviderAccount = {
      id,
      provider,
      keychainRef,
      configJson,
      createdAt: now,
      updatedAt: now
    };

    await this.repository.upsertProviderAccount(account);
    return account;
  }

  async resolveApiKey(account: ProviderAccount): Promise<string | undefined> {
    return this.keychain.getSecret(account.keychainRef);
  }
}
