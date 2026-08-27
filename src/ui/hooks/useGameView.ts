import { useEffect, useState } from "react";
import { getUiGameView, type UiGameView } from "../../application/queryPorts";
import type { GameEngine } from "../../domain/gameEngine";

export function useGameView(engine: GameEngine): UiGameView {
  const [view, setView] = useState(() => getUiGameView(engine));

  useEffect(
    () => engine.subscribe(() => setView(getUiGameView(engine))),
    [engine],
  );

  return view;
}

