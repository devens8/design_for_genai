import { Dancing_Script } from "next/font/google";
import "./globals.css";

const cursive = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-cursive",
});

export const metadata = {
  title: "Hello World",
  description: "A friendly hello, in cursive.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={cursive.variable}>{children}</body>
    </html>
  );
}
