import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: '"Soehne", "Avenir Next", "Segoe UI", sans-serif',
          background: "#f6f1e8",
          color: "#27241f"
        }}
      >
        {children}
      </body>
    </html>
  );
}
