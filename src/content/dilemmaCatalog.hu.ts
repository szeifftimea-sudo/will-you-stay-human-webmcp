import type { DilemmaCatalog } from "../domain/gameTypes";
import { dilemmaCatalogSchema } from "./dilemmaSchema";
import { apologyDilemma } from "./dilemmas/apology.hu";

export const dilemmaCatalog = dilemmaCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: "hu-spike-2",
  language: "hu",
  dilemmas: [apologyDilemma],
}) as DilemmaCatalog;
