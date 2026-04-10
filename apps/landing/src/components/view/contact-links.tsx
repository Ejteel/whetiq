import type { LandingProfile } from "@mvp/core";
import type { ReactElement } from "react";

type ContactField = keyof Pick<
  LandingProfile,
  "email" | "phone" | "linkedin" | "location"
>;

interface ContactLinkConfig {
  field: ContactField;
  icon: string;
  label: string;
}

const CONTACT_LINKS: readonly ContactLinkConfig[] = [
  { field: "email", icon: "✉", label: "Email" },
  { field: "phone", icon: "☎", label: "Phone" },
  { field: "linkedin", icon: "in", label: "LinkedIn" },
  { field: "location", icon: "⌖", label: "Location" },
];

function getContactHref(
  field: ContactField,
  value: string,
): string | undefined {
  if (field === "email") {
    return `mailto:${value}`;
  }

  if (field === "phone") {
    return `tel:${value}`;
  }

  if (field === "linkedin") {
    return value.startsWith("http") ? value : `https://${value}`;
  }

  return undefined;
}

export function ContactLinks({
  profile,
}: {
  profile: LandingProfile;
}): ReactElement | null {
  const items = CONTACT_LINKS.flatMap((item) => {
    const value = profile[item.field];
    if (!value) {
      return [];
    }

    return [
      {
        ...item,
        href: getContactHref(item.field, value),
        value,
      },
    ];
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="landing-contact-row">
      {items.map((item) =>
        item.href ? (
          <a
            key={item.field}
            className="landing-contact-item"
            href={item.href}
            rel={item.field === "linkedin" ? "noopener noreferrer" : undefined}
            target={item.field === "linkedin" ? "_blank" : undefined}
          >
            <span aria-hidden="true" className="landing-contact-icon">
              {item.icon}
            </span>
            <span className="sr-only">{item.label}: </span>
            <span>{item.value}</span>
          </a>
        ) : (
          <span key={item.field} className="landing-contact-item">
            <span aria-hidden="true" className="landing-contact-icon">
              {item.icon}
            </span>
            <span className="sr-only">{item.label}: </span>
            <span>{item.value}</span>
          </span>
        ),
      )}
    </div>
  );
}
