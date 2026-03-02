import Link from "next/link";

export default function AccessDeniedPage() {
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
          width: "min(480px, 92vw)",
          border: "1px solid #d1cabd",
          borderRadius: 18,
          background: "#f7f4ed",
          padding: 24
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>Access not approved yet</h1>
        <p style={{ marginTop: 10, color: "#5f5a50", lineHeight: 1.4 }}>
          Your account is authenticated, but this private workspace is currently restricted to approved pilot users.
        </p>
        <p style={{ marginTop: 8, color: "#736d61", fontSize: 13 }}>
          Ask the admin to add your email or domain to the pilot allowlist.
        </p>
        <Link
          href="/"
          style={{
            marginTop: 14,
            display: "inline-flex",
            textDecoration: "none",
            border: "1px solid #c5bdaf",
            borderRadius: 12,
            padding: "10px 14px",
            background: "#fffdf8",
            color: "#262521",
            fontWeight: 600
          }}
        >
          Back to Home
        </Link>
      </section>
    </main>
  );
}
