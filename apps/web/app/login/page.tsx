import { LoginButtons } from "./LoginButtons";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const callbackUrl = params.callbackUrl ?? "/private-workspace";
  const errorCode = params.error;
  const hasConfigError = errorCode === "config";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#eeebe4",
        fontFamily: '"Soehne", "Avenir Next", "Segoe UI", sans-serif'
      }}
    >
      <section
        style={{
          width: "min(420px, 92vw)",
          border: "1px solid #d1cabd",
          borderRadius: 18,
          background: "#f7f4ed",
          padding: 24
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>Sign in to Aggreate</h1>
        <p style={{ marginTop: 8, color: "#6a655a" }}>
          OAuth access is enabled for this deployment. Use any available provider to continue.
        </p>
        {hasConfigError ? (
          <p style={{ marginTop: 8, color: "#8f2d2d", fontSize: 13 }}>
            Auth configuration error detected. Verify `AUTH_SECRET` or `NEXTAUTH_SECRET`, and ensure at least one OAuth
            provider is configured.
          </p>
        ) : null}

        <LoginButtons callbackUrl={callbackUrl} />

        <p style={{ marginTop: 12, color: "#7a7467", fontSize: 12 }}>
          Private workspace access requires configured OAuth provider credentials.
        </p>
      </section>
    </main>
  );
}
