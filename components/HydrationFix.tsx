"use client";

import { useEffect } from "react";

/**
 * Component to fix hydration errors caused by browser extensions
 * that modify the DOM before React hydrates
 */
export default function HydrationFix() {
  useEffect(() => {
    // Clean up extension-added attributes that cause hydration mismatches
    const cleanup = () => {
      // Remove contenteditable attributes added by extensions
      const elements = document.querySelectorAll("[contenteditable]");
      elements.forEach((el) => {
        if (el.getAttribute("contenteditable") === "false") {
          el.removeAttribute("contenteditable");
        }
      });

      // Remove cursor styles that might be added by extensions
      const elementsWithCursor = document.querySelectorAll("[style*='cursor']");
      elementsWithCursor.forEach((el) => {
        const style = el.getAttribute("style");
        if (style && style.includes("cursor:pointer")) {
          const newStyle = style.replace(/cursor:\s*pointer;?/g, "").trim();
          if (newStyle) {
            el.setAttribute("style", newStyle);
          } else {
            el.removeAttribute("style");
          }
        }
      });
    };

    // Run cleanup after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(cleanup, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
