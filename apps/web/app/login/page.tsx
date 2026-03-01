export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const callbackUrl = params.callbackUrl ?? "/";
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
          OAuth access is enabled for this deployment. Sign in with GitHub to continue.
        </p>

        <a
          href={`/api/auth/signin/github?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          style={{
            display: "inline-block",
            marginTop: 12,
            textDecoration: "none",
            border: "1px solid #c5bdaf",
            borderRadius: 12,
            padding: "10px 14px",
            background: "#fffdf8",
            color: "#262521",
            fontWeight: 600
          }}
        >
          Continue with GitHub
        </a>
      </section>
    </main>
  );
}
