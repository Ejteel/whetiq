import { WorkspaceClient } from "../workspace/WorkspaceClient";

export default function PrivateWorkspacePage() {
  return <WorkspaceClient chatEndpoint="/api/chat" mode="private" />;
}
