// Keychain abstraction for secure provider credential storage.

const memorySecrets = new Map<string, string>();

export interface KeychainClient {
  setSecret(ref: string, value: string): Promise<void>;
  getSecret(ref: string): Promise<string | undefined>;
  deleteSecret(ref: string): Promise<void>;
}

export class InMemoryKeychainClient implements KeychainClient {
  async setSecret(ref: string, value: string): Promise<void> {
    memorySecrets.set(ref, value);
  }

  async getSecret(ref: string): Promise<string | undefined> {
    return memorySecrets.get(ref);
  }

  async deleteSecret(ref: string): Promise<void> {
    memorySecrets.delete(ref);
  }
}

export class OSKeychainClient implements KeychainClient {
  constructor(private readonly serviceName = "canonical-chat-mvp") {}

  private async keytar(): Promise<{
    setPassword(service: string, account: string, password: string): Promise<void>;
    getPassword(service: string, account: string): Promise<string | null>;
    deletePassword(service: string, account: string): Promise<boolean>;
  }> {
    return import("keytar");
  }

  async setSecret(ref: string, value: string): Promise<void> {
    const keytar = await this.keytar();
    await keytar.setPassword(this.serviceName, ref, value);
  }

  async getSecret(ref: string): Promise<string | undefined> {
    const keytar = await this.keytar();
    const value = await keytar.getPassword(this.serviceName, ref);
    return value ?? undefined;
  }

  async deleteSecret(ref: string): Promise<void> {
    const keytar = await this.keytar();
    await keytar.deletePassword(this.serviceName, ref);
  }
}
