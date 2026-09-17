import { useEffect, useRef, useState } from "react";
import { REVEAL_COPY, type RevealStep } from "./revealSequence";
import "./productReveal.css";
import { reviewShot } from "./revealShots";

export function ProductReveal() {
  const shot = reviewShot(window.location.search);
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<{ go: (step: RevealStep) => void; dispose: () => void } | null>(null);
  const [step, setStep] = useState<RevealStep>(0);
  const [ready, setReady] = useState(false);
  const [moving, setMoving] = useState(false);
  const [quiet, setQuiet] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const element = host.current!;
    import("./revealRenderer").then(({ createRevealRenderer }) => createRevealRenderer(element, () => {
      if (!cancelled) setMoving(false);
    })).then((renderer) => {
      if (cancelled) renderer.dispose();
      else { controller.current = renderer; setReady(true); }
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; controller.current?.dispose(); controller.current = null; };
  }, []);
  useEffect(() => {
    if (step !== 2 || moving || !quiet) return;
    const timer = window.setTimeout(() => setQuiet(false), 1500);
    return () => window.clearTimeout(timer);
  }, [step, moving, quiet]);
  const go = (next: RevealStep) => {
    setQuiet(next === 2);
    setMoving(true); setStep(next); controller.current?.go(next);
  };
  const copy = REVEAL_COPY[step];
  return <main className="product-reveal" lang="en" data-reveal-step={step} data-review-shot={shot ? "true" : undefined} aria-busy={moving}>
    <div className="product-reveal__canvas" ref={host} aria-hidden="true" />
    <header className="product-reveal__header" hidden={quiet}><span>WILL YOU STAY HUMAN?</span><span>Physical companion to the online experience</span></header>
    {shot && <p className="product-reveal__shot-title">{shot.title}</p>}
    <section className="product-reveal__copy" aria-live="polite" aria-hidden={quiet || moving} style={{ visibility: quiet ? "hidden" : undefined }}>
      <p className="product-reveal__eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="product-reveal__description">{copy.description}</p>
    </section>
    <footer className="product-reveal__controls" aria-hidden={quiet} style={{ visibility: quiet ? "hidden" : undefined }}>
      {error ? <p role="alert">The 3D preview could not load. Please reload this page to try again.</p>
        : !ready ? <p role="status">Preparing the companion…</p>
        : step < 3 ? <button className="primary-action" disabled={moving} onClick={() => go((step + 1) as RevealStep)}>{copy.action}<span aria-hidden="true">→</span></button>
        : moving ? <button className="primary-action" disabled>{copy.action}<span aria-hidden="true">→</span></button>
        : <a className="primary-action" href="/play">{copy.action}<span aria-hidden="true">→</span></a>}
      {ready && step > 0 && <button className="product-reveal__replay" disabled={moving} onClick={() => go(0)}>Replay reveal</button>}
      {step === 3 && <p className="product-reveal__dimensions">Convenience · Control · Connection · Freedom · Responsibility</p>}
    </footer>
  </main>;
}
