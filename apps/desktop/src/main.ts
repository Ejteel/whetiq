import { ChatService } from "@mvp/api";
import { InMemoryRepository } from "@mvp/storage";

export interface DesktopRuntime {
  chatService: ChatService;
}

// Replace with actual Electron app bootstrap.
export function createDesktopRuntime(): DesktopRuntime {
  const repository = new InMemoryRepository();
  const chatService = new ChatService(repository, async () => process.env.OPENAI_API_KEY);

  return { chatService };
}
