import type { LandingProfile } from "@mvp/core";
import type { ReactElement } from "react";

type ContactField = keyof Pick<
  LandingProfile,
  "email" | "phone" | "linkedin" | "location"
>;

function EmailIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="3" width="14" height="10" rx="1.5" />
      <polyline points="1,3 8,9.5 15,3" />
    </svg>
  );
}

function PhoneIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 2.5C2 2 2.5 1 4 1.5l2 1C6.5 3 7 3.5 6.5 4.5L5.5 6C6.5 8 8 9.5 10 10.5l1.5-1c1-0.5 1.5 0 2 0.5l1 2C15 13.5 14 14 13.5 14 6 14 2 8 2 2.5z" />
    </svg>
  );
}

function LinkedInIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
    </svg>
  );
}

function LocationIcon(): ReactElement {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5z" />
      <circle cx="8" cy="6" r="1.5" />
    </svg>
  );
}

interface ContactLinkConfig {
  field: ContactField;
  Icon: () => ReactElement;
  label: string;
}

const CONTACT_LINKS: readonly ContactLinkConfig[] = [
  { field: "email", Icon: EmailIcon, label: "Email" },
  { field: "phone", Icon: PhoneIcon, label: "Phone" },
  { field: "linkedin", Icon: LinkedInIcon, label: "LinkedIn" },
  { field: "location", Icon: LocationIcon, label: "Location" },
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
      {items.map((item) => {
        const { Icon } = item;
        const inner = (
          <>
            <span aria-hidden="true" className="landing-contact-icon">
              <Icon />
            </span>
            <span className="sr-only">{item.label}: </span>
            <span>{item.value}</span>
          </>
        );

        return item.href ? (
          <a
            key={item.field}
            className="landing-contact-item"
            href={item.href}
            rel={item.field === "linkedin" ? "noopener noreferrer" : undefined}
            target={item.field === "linkedin" ? "_blank" : undefined}
          >
            {inner}
          </a>
        ) : (
          <span key={item.field} className="landing-contact-item">
            {inner}
          </span>
        );
      })}
    </div>
  );
}
