import type { ReactElement, ReactNode } from "react";

export default function ProfileLayout({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return <>{children}</>;
}
