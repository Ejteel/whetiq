import type { ReactElement } from "react";

export function LandingFooter({
  email,
  name,
}: {
  email: string | null;
  name: string;
}): ReactElement {
  return (
    <footer className="landing-footer">
      <span className="landing-footer-spacer" aria-hidden="true" />
      <span className="landing-footer-copy">
        © {new Date().getFullYear()} {name}
      </span>
      {email ? (
        <a className="landing-footer-link" href={`mailto:${email}`}>
          Get in touch
        </a>
      ) : (
        <span className="landing-footer-spacer" aria-hidden="true" />
      )}
    </footer>
  );
}
