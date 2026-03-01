import "./globals.css";
import type { ReactNode } from "react";

const criticalStyles = `
:root{--bg:#eeebe4;--text:#262521}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--text);font-family:"Soehne","Avenir Next","Segoe UI",sans-serif;font-size:14px;line-height:1.45;-webkit-text-size-adjust:100%}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <style dangerouslySetInnerHTML={{ __html: criticalStyles }} />
        {children}
      </body>
    </html>
  );
}
