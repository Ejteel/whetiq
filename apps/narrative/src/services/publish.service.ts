import type { IProfileRepository } from "@mvp/storage";

export class PublishService {
  constructor(private readonly repository: IProfileRepository) {}

  async publish(slug: string): Promise<void> {
    const profile = await this.repository.getDraftBySlug(slug);
    await this.repository.publish(profile.id);
  }
}
