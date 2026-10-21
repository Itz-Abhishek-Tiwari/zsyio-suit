"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  // When pathname or searchParams change, navigation completed
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  // Global listener for link clicks to provide 0ms visual feedback
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (
        anchor &&
        anchor.href &&
        !anchor.target &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const url = new URL(anchor.href, window.location.href);
        // Only trigger if navigating to same origin and different path/search
        if (url.origin === window.location.origin) {
          const isSamePage =
            url.pathname === window.location.pathname &&
            url.search === window.location.search;
          if (!isSamePage) {
            setIsNavigating(true);
          }
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] overflow-hidden pointer-events-none bg-primary/20">
      <div className="absolute top-0 h-full w-full animate-loading-bar bg-primary" />
    </div>
  );
}
