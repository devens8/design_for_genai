import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import ScrollReveal from "./components/ScrollReveal";
import SiteFooter from "./components/SiteFooter";

// Fraunces (soft, variable serif with real italics) for display type; DM Sans
// for body and UI.
const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-display",
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: { default: "Little Spots NYC", template: "%s · Little Spots NYC" },
  description: "Where to go tonight in New York: AI-found spots, loved (or not) by locals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>
        <NavBar />
        {children}
        <SiteFooter />
        <ScrollReveal />
      </body>
    </html>
  );
}
