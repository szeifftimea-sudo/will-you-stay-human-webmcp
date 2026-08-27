import { z } from "zod";

const lensSchema = z.enum(["brain", "hand", "heart"]);
const balanceSchema = z.object({
  comfort: z.number().int().min(-2).max(2),
  control: z.number().int().min(-2).max(2),
  connection: z.number().int().min(-2).max(2),
  freedom: z.number().int().min(-2).max(2),
  responsibility: z.number().int().min(-2).max(2),
});

const reflectionSchema = z.object({
  counterargument: z.string().min(1),
  blindSpot: z.string().min(1),
  secondaryConsequence: z.string().min(1),
  question: z.string().min(1),
});

const consequenceSchema = z.object({
  delta: balanceSchema,
  gains: z.array(z.string().min(1)).min(1),
  costs: z.array(z.string().min(1)).min(1),
  explanation: z.string().min(1),
  closingReflection: z.string().min(1),
  physicalInstructions: z.array(z.string()),
});

const lensOptionSchema = z.object({
  lens: lensSchema,
  label: z.enum(["AGY", "KÉZ", "SZÍV"]),
  framing: z.string().min(1),
  choiceText: z.string().min(1),
  reflection: reflectionSchema,
  consequence: consequenceSchema,
});

const dilemmaSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string().min(1),
  status: z.enum(["draft", "playable", "disabled"]),
  order: z.number().int().nonnegative(),
  title: z.string().min(1),
  callPrompt: z.string().min(1),
  situation: z.string().min(1),
  automationPromise: z.string().min(1),
  centralTension: z.string().min(1),
  contentNotice: z.string().min(1).nullable(),
  canSkip: z.boolean(),
  lenses: z.tuple([lensOptionSchema, lensOptionSchema, lensOptionSchema]),
});

export const dilemmaCatalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    contentVersion: z.string().min(1),
    language: z.literal("hu"),
    dilemmas: z.array(dilemmaSchema).min(1),
  })
  .superRefine((catalog, context) => {
    for (const [index, dilemma] of catalog.dilemmas.entries()) {
      if (dilemma.status !== "playable") continue;
      const lenses = dilemma.lenses.map(({ lens }) => lens);
      if (new Set(lenses).size !== 3 || !["brain", "hand", "heart"].every((lens) => lenses.includes(lens as never))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dilemmas", index, "lenses"],
          message: "Minden játszható dilemma pontosan egy AGY, KÉZ és SZÍV ágat tartalmaz.",
        });
      }
    }
  });

