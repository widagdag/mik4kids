import { useEffect, useRef, useState, type ReactNode } from "react";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Fade-and-rise reveal on first scroll into view.
 *
 * Dependency-free stand-in for framer-motion's whileInView reveal so the
 * landing page (the entry chunk) doesn't pull the whole animation library.
 * Mirrors the previous motion config: opacity 0→1, y 16→0, 0.6s,
 * once, -80px bottom viewport margin.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(16px)",
        transition: `opacity 0.6s ${EASE}, transform 0.6s ${EASE}`,
      }}
    >
      {children}
    </div>
  );
}
