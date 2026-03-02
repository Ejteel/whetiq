import Link from "next/link";

export default function LandingPage() {
  const isDemo = process.env.DEMO_MODE === "true";
  const authMode = process.env.PREVIEW_AUTH_MODE ?? "none";
  const isOAuth = authMode === "oauth";
  const privateHref = isOAuth ? "/login?callbackUrl=%2Fworkspace" : "/workspace";

  return (
    <main className="landing">
      <header className="landingHeader">
        <p className="eyebrow">Aggreate AI Prompt Enhancer</p>
        <h1>Multi-provider prompt intelligence for founders and teams</h1>
        <p>
          Route one request across model ecosystems, apply consistent enhancement, and present canonical output in a
          single workspace.
        </p>
        <div className="modeRow">
          <span className={`modeBadge ${isDemo ? "demo" : "live"}`}>{isDemo ? "Demo Mode" : "Live Mode"}</span>
          <span>{isDemo ? "No external provider calls are made." : "Provider keys are active for live responses."}</span>
        </div>
      </header>

      <section className="accessGrid">
        <article className="accessCard">
          <h2>Try Live Demo</h2>
          <p>Instant guided experience. Safe for public sharing and portfolio review.</p>
          <ul>
            <li>No signup required in public demo mode</li>
            <li>Shows full UI, enhancer behavior, and thread UX</li>
            <li>Great for LinkedIn and investor previews</li>
          </ul>
          <Link className="accessPrimary" href="/workspace">
            Open Demo Workspace
          </Link>
        </article>

        <article className="accessCard">
          <h2>Founder / Pilot Access</h2>
          <p>Protected environment for real provider testing, pilot users, and investor diligence.</p>
          <ul>
            <li>OAuth login for controlled access</li>
            <li>Real model routing and provider switching</li>
            <li>Suitable for design-partner pilots</li>
          </ul>
          <Link className="accessSecondary" href={privateHref}>
            {isOAuth ? "Sign In for Private Workspace" : "Enter Private Workspace"}
          </Link>
          <p className="accessMeta">
            Auth mode: <strong>{authMode}</strong>
          </p>
        </article>
      </section>
    </main>
  );
}
