"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const LINKS = [
  { href: "/vault", label: "Discover" },
  { href: "/vault?sort=top", label: "Top Rated" },
  { href: "/saved", label: "Saved" },
  { href: "/locations", label: "NYC Classics" },
];

function Links({ initial, email }) {
  const pathname = usePathname();
  const sort = useSearchParams().get("sort");
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the page changes.
  useEffect(() => setOpen(false), [pathname, sort]);

  function isActive(href) {
    const [path, query] = href.split("?");
    if (path !== pathname) return false;
    if (path === "/vault") return query ? sort === "top" : sort !== "top";
    return true;
  }

  return (
    <>
      <button
        type="button"
        className="menu-btn"
        aria-expanded={open}
        aria-controls="main-menu"
        onClick={() => setOpen(!open)}
      >
        <span className="menu-icon" aria-hidden="true" />
        {open ? "Close" : "Menu"}
      </button>
      <div id="main-menu" className={`nav-menu ${open ? "open" : ""}`}>
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
        <div className="nav-access">
          <Link
            href="/generate"
            className={`btn btn--primary btn--sm ${pathname === "/generate" ? "is-current" : ""}`}
            aria-current={pathname === "/generate" ? "page" : undefined}
          >
            Find a Spot
          </Link>
          <Link href="/dashboard" className="nav-avatar" title={`My activity (${email})`} aria-label="My activity">
            {initial}
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="nav-signout">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// useSearchParams needs a Suspense boundary so static pages can still prerender.
export default function NavLinks(props) {
  return (
    <Suspense fallback={<div className="nav-menu" />}>
      <Links {...props} />
    </Suspense>
  );
}
