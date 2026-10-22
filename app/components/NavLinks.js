"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/vault", label: "Vault" },
  { href: "/vault?sort=top", label: "Top rated" },
  { href: "/saved", label: "Saved" },
  { href: "/generate", label: "+ Generate" },
  { href: "/locations", label: "Classics" },
];

function Links() {
  const pathname = usePathname();
  const sort = useSearchParams().get("sort");

  function isActive(href) {
    const [path, query] = href.split("?");
    if (path !== pathname) return false;
    if (path === "/vault") return query ? sort === "top" : sort !== "top";
    return true;
  }

  return (
    <nav className="nav-links" aria-label="Main">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={isActive(l.href) ? "active" : ""}
          aria-current={isActive(l.href) ? "page" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

// useSearchParams needs a Suspense boundary so static pages can still prerender.
export default function NavLinks() {
  return (
    <Suspense fallback={<nav className="nav-links" aria-label="Main" />}>
      <Links />
    </Suspense>
  );
}
