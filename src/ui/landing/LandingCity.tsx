import { useEffect, useRef, useState } from "react";
import "./landingCity.css";

/** Decorative entry layer. It never receives state, ports or player commands. */
export function LandingCity({ active = true, onEntryReady }: { active?: boolean; onEntryReady?: (ready: boolean) => void }) {
  const [visible, setVisible] = useState(active);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active) { setVisible(true); return; }
    const delay = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 120 : 900;
    const timeout = window.setTimeout(() => setVisible(false), delay);
    return () => window.clearTimeout(timeout);
  }, [active]);
  useEffect(() => {
    if (!visible) return;
    const element = host.current!;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    // Keep the original illustrated backdrop and working HTML on unsupported devices.
    onEntryReady?.(false);
    const ready = () => { if (!cancelled) onEntryReady?.(true); };
    const fallback = () => { if (!cancelled) { element.dataset.ready = "fallback"; ready(); } };
    if (typeof WebGLRenderingContext === "undefined") { fallback(); return; }
    // A failed or stalled decorative asset must never block entry to the game.
    const timeout = window.setTimeout(ready, 10000);
    import("./landingCityRenderer").then(({ createLandingCity }) => createLandingCity(element, ready))
      .then(renderer => {
        if (cancelled) renderer.dispose();
        else { dispose = renderer.dispose; element.dataset.ready = "true"; }
      }).catch(fallback);
    return () => { cancelled = true; window.clearTimeout(timeout); dispose?.(); };
  }, [onEntryReady, visible]);
  return visible ? <div ref={host} className="landing-city" aria-hidden="true" data-active={active} data-testid="landing-city" /> : null;
}
