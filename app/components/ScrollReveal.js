"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fades `.reveal` elements up as they scroll into view. Elements are visible
// by default; the `js-reveal` class (added here) is what hides them first, so
// nothing disappears if JS fails. CSS turns this off under
// prefers-reduced-motion.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    const watch = () =>
      document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
