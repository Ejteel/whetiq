export default function AccessDeniedPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section style={{ width: "min(460px, 92vw)", background: "#fffaf2", border: "1px solid #d6cebf", borderRadius: 14, padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Access Denied</h1>
        <p>Your identity is valid, but your account is not approved for the admin control plane.</p>
      </section>
    </main>
  );
}
