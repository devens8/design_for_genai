import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

// Mono for data/labels/headings (the "terminal" feel), Inter for body copy.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: { default: "NYC Vault", template: "%s · NYC Vault" },
  description: "AI-picked places to go in New York, rated by the community.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${mono.variable} ${sans.variable}`}>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
