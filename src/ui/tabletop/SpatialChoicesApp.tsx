import { App } from "../../app/App";
import type { AppServices } from "../../app/bootstrap";
import { ChoiceDepthLayer } from "./ChoiceDepthLayer";
import { BalanceModelLayer } from "./BalanceModelLayer";
import "./spatialAtmosphere.css";

/** Visual-only opt-in: all journey, sound and player commands stay in App. */
export function SpatialChoicesApp({ services }: { services: AppServices }) {
  return (
    <div className="spatial-journey">
      <App services={services} choiceDepth={ChoiceDepthLayer} balanceDepth={BalanceModelLayer} balanceLocale="en" />
    </div>
  );
}
