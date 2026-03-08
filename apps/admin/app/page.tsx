import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { redirect } from "next/navigation";
import { LoginButtons } from "./LoginButtons";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    redirect("/internal");
  }

  const hasGitHub = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
  const hasGoogle = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section style={{ width: "min(520px, 92vw)", background: "#fffaf2", border: "1px solid #d6cebf", borderRadius: 14, padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>WhetIQ Control Plane</h1>
        <p>Shared internal admin for managing runtime mode and access across applications.</p>
        <LoginButtons hasGitHub={hasGitHub} hasGoogle={hasGoogle} />
      </section>
    </main>
  );
}
