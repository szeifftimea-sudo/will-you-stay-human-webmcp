export const AUDIENCE_IDS = ["10-13", "14-17", "18-plus", "all"] as const;
export type AudienceId = (typeof AUDIENCE_IDS)[number];

export const CONTEXT_IDS = ["solo", "family", "classroom", "workshop", "workplace"] as const;
export type ContextId = (typeof CONTEXT_IDS)[number];

export const SENSITIVITY_LEVELS = ["low", "moderate", "high"] as const;
export type SensitivityLevel = (typeof SENSITIVITY_LEVELS)[number];

export interface DilemmaMetadata {
  dilemmaId: string;
  conceptId: string;
  categoryId: string;
  audienceIds: AudienceId[];
  contextIds: ContextId[];
  tags: string[];
  sensitivityLevel?: SensitivityLevel;
}

export const dilemmaMetadata = [
  {
    dilemmaId: "apology-delegation",
    conceptId: "apology-delegation",
    categoryId: "relationships-communication",
    audienceIds: ["14-17", "18-plus"],
    contextIds: ["solo", "family", "workshop"],
    tags: ["ai-delegation", "relationship", "communication", "responsibility", "trust"],
    sensitivityLevel: "moderate",
  },
  {
    dilemmaId: "homework-delegation",
    conceptId: "homework-delegation",
    categoryId: "learning-development",
    audienceIds: ["10-13", "14-17"],
    contextIds: ["solo", "family", "classroom", "workshop"],
    tags: ["ai-delegation", "authorship", "responsibility", "education", "critical-thinking"],
    sensitivityLevel: "low",
  },
  {
    dilemmaId: "interview-shortlist-delegation",
    conceptId: "interview-shortlisting",
    categoryId: "work-governance",
    audienceIds: ["18-plus"],
    contextIds: ["solo", "workshop", "workplace"],
    tags: ["ai-delegation", "responsibility", "bias", "trust", "hiring"],
    sensitivityLevel: "moderate",
  },
  {
    dilemmaId: "claim-verification-delegation",
    conceptId: "claim-verification",
    categoryId: "information-public-life",
    audienceIds: ["14-17", "18-plus"],
    contextIds: ["solo", "family", "classroom", "workshop"],
    tags: ["ai-delegation", "misinformation", "trust", "responsibility", "critical-thinking"],
    sensitivityLevel: "moderate",
  },
] satisfies DilemmaMetadata[];

export const dilemmaMetadataById = Object.fromEntries(
  dilemmaMetadata.map((metadata) => [metadata.dilemmaId, metadata]),
) as Record<string, DilemmaMetadata>;
