import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { createBrowserServices } from "./app/bootstrap";
import { presentationRoute } from "./app/presentationRoute";
import "./ui/styles/app.css";

const root = document.getElementById("root");
if (!root) throw new Error("A React gyökérelem hiányzik.");

// Public presentation routes reuse the approved scenes; legacy review URLs remain valid.
// Keep the public root canonical: the V2 spatial journey is served from /play.
if ((window.location.pathname.replace(/\/+$/, "") || "/") === "/" && !window.location.search) {
  window.history.replaceState(null, "", "/play");
}
const TabletopApp = lazy(() => import("./ui/tabletop/TabletopApp").then((module) => ({ default: module.TabletopApp })));
const SpatialChoicesApp = lazy(() => import("./ui/tabletop/SpatialChoicesApp").then((module) => ({ default: module.SpatialChoicesApp })));
const route = presentationRoute(window.location.pathname, window.location.search);
const ProductReveal = lazy(() => import("./ui/productReveal/ProductReveal").then((module) => ({ default: module.ProductReveal })));
if (route === "product") {
  createRoot(root).render(<StrictMode><Suspense fallback={null}><ProductReveal /></Suspense></StrictMode>);
} else {
const services = createBrowserServices();

createRoot(root).render(
  <StrictMode>
    {route === "spatial"
      ? <Suspense fallback={null}><SpatialChoicesApp services={services} /></Suspense>
      : route === "prototype"
      ? <Suspense fallback={null}><TabletopApp services={services} /></Suspense>
      : <App services={services} />}
  </StrictMode>,
);
}
