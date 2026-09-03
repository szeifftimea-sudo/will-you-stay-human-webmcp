import type { DilemmaCatalog } from "../domain/gameTypes";
import { dilemmaCatalogSchema } from "./dilemmaSchema";
import { apologyDilemma } from "./dilemmas/apology.hu";
import { claimVerificationDilemma } from "./dilemmas/claimVerification.hu";
import { homeworkDilemma } from "./dilemmas/homework.hu";
import { interviewShortlistDilemma } from "./dilemmas/interviewShortlist.hu";

export const dilemmaCatalog = dilemmaCatalogSchema.parse({
  schemaVersion: 1,
  contentVersion: "hu-catalog-0.2.1",
  language: "hu",
  dilemmas: [
    apologyDilemma,
    homeworkDilemma,
    interviewShortlistDilemma,
    claimVerificationDilemma,
  ],
}) as DilemmaCatalog;
