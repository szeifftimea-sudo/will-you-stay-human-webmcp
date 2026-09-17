import { useEffect, useRef, type ReactNode } from "react";
import "./balanceResultTransition.css";

/** Presentation only: the confirmed result is already applied before mounting. */
export function BalanceResultTransition({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const heading = stage.current?.querySelector<HTMLElement>("#balance-title");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, []);
  return <div ref={stage} className="balance-stage balance-result-transition" aria-live="polite">{children}</div>;
}
