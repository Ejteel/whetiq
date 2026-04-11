import { WorkspaceClient } from "./WorkspaceClient";

export default function HomePage() {
  return <WorkspaceClient chatEndpoint="/api/chat/demo" mode="demo" />;
}
