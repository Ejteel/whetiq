import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    redirect("/internal");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section style={{ width: "min(520px, 92vw)", background: "#fffaf2", border: "1px solid #d6cebf", borderRadius: 14, padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>WhetIQ Control Plane</h1>
        <p>Shared internal admin for managing runtime mode and access across applications.</p>
        <a href="/api/auth/signin/auth0?callbackUrl=/internal">Sign in with Managed Identity</a>
      </section>
    </main>
  );
}
