# Will You Stay Human? — Heart in the Machine

**An online decision game about AI delegation where a human decides how much authority to give an AI agent—and the architecture enforces that boundary.**

Futura performs real, stateful work inside the live game: it enters Machine City, presents dilemmas, reveals reflections tied to the player’s current selection, reads structured state, and uncovers the consequences of confirmed decisions. But it cannot choose MIND, HAND, or HEART, acknowledge its own reflection, or confirm a moral decision.

The product does what it argues: the Machine may assist and act, but the boundary of delegation remains human.

The live product is a working single-player vertical slice with four playable dilemmas, persistent multi-round state, five registered WebMCP tools, and an English–Hungarian interface that defaults to English.

| Submission link | Status |
|---|---|
| Live app | [https://will-you-stay-human.vercel.app](https://will-you-stay-human.vercel.app) |
| Public source repository | [https://github.com/szeifftimea-sudo/will-you-stay-human-webmcp](https://github.com/szeifftimea-sudo/will-you-stay-human-webmcp) |

## Spatial release checkpoint

The approved spatial game and separate product reveal have explicit public entry points:

- **[Play the spatial game](https://will-you-stay-human.vercel.app/play)** — Machine City intro through the domain-driven Human Balance result.
- **[Explore the tabletop concept](https://will-you-stay-human.vercel.app/product)** — box, interior, folded Human Balance and unfolding reveal; **Enter the game** continues to `/play`.

Both routes are live production entry points and have been QA-checked. The original `/` entry remains available. Use `/play` and `/product` as the direct Product Hunt destinations, without developer query parameters.

The box, foldable Human Balance and five markers are a **physical companion concept/prototype**, not a manufactured or manufacturing-validated product. Fit checks and Blender animations demonstrate the concept, not production tolerances, durability, safety certification or availability for purchase.

Editable Blender sources are in `assets/blender/`, authoring recipes in `scripts/blender/`, and web exports in `public/models/`. The 3D presentation does not compute game outcomes or change the human-only selection and confirmation boundary. [Checkpoint and QA scope](docs/RELEASE_CHECKPOINT.md).

## The idea

The project takes cultural and conceptual inspiration from *Metropolis*, but builds an original world, story, and interaction model. MIND–HAND–HEART is not decoration: it is the core decision mechanic.

- **MIND:** the Machine helps, but the human decides.
- **HAND:** the human delegates the action to the Machine.
- **HEART:** the human keeps both the decision and the action.

The central question is not whether AI is good or bad. It is: **where does a person draw the boundary of delegation?** None of the three paths is presented as morally superior. Each can preserve something human while giving something else away.

The current journey applies that question to four dilemmas, in a fixed order:

1. apologizing to someone you hurt;
2. completing a homework assignment with permitted AI assistance;
3. shortlisting candidates for job interviews;
4. deciding whether a fast-spreading claim is true.

All four are playable in one session. Decisions, revealed outcomes, and the Human Balance accumulate across rounds. A reset is available only after the fourth dilemma reaches `GAME_COMPLETE`.

## Astra-assisted V2 — concrete results

The original product thesis, V1 core logic, and WebMCP architecture existed before Astra. GPT-6 Astra was used in Codex to take that existing direction further in V2, especially through spatial and 3D product work.

The V2 work created or advanced these editable Blender sources:

- `assets/blender/machine-city-landing.blend`
- `assets/blender/machine-city-landing-depth.blend`
- `assets/blender/human-balance.blend`
- `assets/blender/companion-product-box.blend`
- `assets/blender/product-reveal-animated.blend`

This included the 3D Machine City, spatial landing and presentation, the Human Balance model, the physical companion box and foldable-balance concept, product-reveal animation, Blender camera/light/depth/material work, procedural authoring scripts, browser-ready GLB exports, React/Three.js integration, and iterative implementation, visual review, and testing of `/play` and `/product`.

The hybrid/tabletop direction was already part of the product vision. Astra helped turn that direction into editable 3D assets, a spatial web experience, and an iteratively tested V2 implementation; it did not define the product thesis or autonomously design the product. Product direction, the MIND–HAND–HEART model, the meaning of the five Human Balance dimensions, the human–agent authority boundary, visual accept/reject decisions, priorities, and final UX decisions remained human-owned.

The launch scope contains the approved `/play` journey, the `/product` box-to-unfold reveal, and their source assets. Rejected review experiments—including the lifestyle closure and bedside scene—are excluded from the launch product and remain post-launch ideas only.

## Human Balance

Each revealed consequence moves a five-axis reflection instrument:

- **Convenience**
- **Control**
- **Connection**
- **Freedom**
- **Responsibility**

The Human Balance is neither a moral score nor a personality test. It makes the player's emerging delegation pattern visible across several decisions: what they kept, what they handed to the Machine, and which trade-offs accumulated along the way. The game does not rank players by who is “more human.”

## Why WebMCP

This interaction requires more than a chatbot beside a webpage. The agent must act on the live, authoritative state of the same experience the player is using.

The player and Futura alternate responsibility:

1. Futura enters Machine City and presents the next available dilemma.
2. The player chooses MIND, HAND, or HEART in the web UI.
3. Futura receives the current `tentativeSelectionId` and reveals the reflection for that exact choice.
4. The player can keep the direction or return and choose another one.
5. The player acknowledges the reflection and confirms the final decision.
6. Futura receives the resulting `confirmedDecisionId` and reveals its consequence.
7. The application applies the balance delta exactly once and exposes the next valid action.

Each structured result returns the current phase and revision, so Futura can reason from fresh application state instead of guessing from conversation history. WebMCP is therefore part of the game mechanic rather than a decorative agent layer.

## Human authority and state safety

The domain is reached through two separate ports:

```text
WebMCP client ──> registered tools ──> AgentCommandPort ──┐
                                                         ├──> GameEngine ──> persisted session
Player UI ────────────────────────> PlayerCommandPort ───┘
```

`AgentCommandPort` exposes only:

- `enterMachineCity`
- `presentDilemma`
- `presentChoiceReflection`
- `revealConfirmedConsequence`

`PlayerCommandPort` exclusively owns:

- `selectLens`
- `acknowledgeReflection`
- `confirmDecision`
- `resetGame`

`AgentCommandPort` cannot reach the player-only methods, so the WebMCP agent cannot supply the player's optional reasoning or reset an unfinished game.

The domain reinforces the port boundary with explicit state and identity safeguards:

- tentative selections and confirmed decisions use `PLAYER_UI`;
- presented reflections use `WEBMCP_AGENT`;
- consequence application stores a tool execution receipt.
- **`sessionId`** binds every post-entry operation to the active persisted game.
- **`expectedRevision`** provides optimistic concurrency control, so a stale agent request cannot silently overwrite newer human activity.
- **`tentativeSelectionId`** ties a reflection to the player's current, replaceable selection. Choosing another path supersedes the old ID and invalidates its reflection.
- **`confirmedDecisionId`** proves that the player created the final decision consumed by the reveal tool.
- Matching reflection and reveal retries return saved results instead of duplicating transitions or Human Balance effects.
- **`playableDilemmaCount`** is derived from the active catalog by counting `status === "playable"`; it is not a manually maintained scope constant.

The React journey also contains presentation-only stages, such as the MIND–HAND–HEART guide and the staged reveal of the Human Balance. These do not grant new domain capabilities. A selected card becomes a persisted but reversible `TentativeSelection`; it is not a final decision. Only `confirmDecision`, after reflection acknowledgement, creates an irreversible `ConfirmedDecision`.

## WebMCP tools

The app registers exactly five imperative tools through `document.modelContext.registerTool`.

| Tool | Structured input | State access | Valid state and result |
|---|---|---|---|
| `enter_machine_city` | `{}` | Mutating when no session exists; otherwise idempotent | Creates `MACHINE_CITY_READY` or resumes the current session without resetting it. Returns `language`, `resumed`, `balance`, and the dynamically calculated `playableDilemmaCount`—currently `4`, from catalog entries whose status is `playable`. |
| `present_dilemma` | `sessionId`, `expectedRevision` | Mutating | Valid in `MACHINE_CITY_READY` and `CONSEQUENCE_REVEALED`. Presents the next uncompleted playable dilemma in catalog order, or moves to `GAME_COMPLETE` after the final round. Returns the public dilemma, `gameComplete`, and `decisionStatus`. |
| `get_current_game_state` | `sessionId` | Read-only | Valid for an active session. Returns the agent-safe state view: phase, revision, active dilemma, opaque selection/reflection/decision IDs, acknowledgement state, balance, and completed dilemma IDs. |
| `present_choice_reflection` | `sessionId`, `tentativeSelectionId`, `expectedRevision` | Mutating on first presentation; idempotent for the same selection | A new reflection requires `TENTATIVE_SELECTION_RECORDED`. A matching retry can return the stored reflection in `REFLECTION_PRESENTED`, `READY_FOR_CONFIRMATION`, or `DECISION_CONFIRMED`. Returns the selected lens, reflection content, `reflectionId`, and `alreadyPresented`. |
| `reveal_confirmed_consequence` | `sessionId`, `confirmedDecisionId`, `expectedRevision` | Mutating on first reveal; idempotent afterward | A new reveal requires `DECISION_CONFIRMED`. A retry with a decision already stored in outcome history returns its saved result without applying the effect again. Returns gains, costs, explanation, reflection prompt, raw/applied deltas, balances before/after, and `alreadyRevealed`. |

Every successful tool uses a common structured envelope:

```ts
{
  ok: true,
  tool,
  schemaVersion: 1,
  sessionId,
  phase,
  stateRevision,
  data,
  nextAllowedActions
}
```

Failures are also structured and include `error.code`, `error.message`, and `error.recoverable` together with the latest available session metadata.

The visible UI defaults to English and stores an explicit `HU` or `EN` preference across the game and restart. Locale selection is deliberately presentation-only: it does not change `sessionId`, `stateRevision`, decision IDs, domain transitions, or WebMCP contracts. The underlying versioned dilemma catalog remains stable while the presentation layer supplies the approved English or Hungarian copy.

## Run locally

### Prerequisites

- Node.js 24 or later
- pnpm 11.19.0, as declared by the repository's `packageManager` field
- A modern browser for ordinary UI development
- A WebMCP-enabled Chrome build or ChatGPT in-app browser for tool discovery and invocation

### Install

```bash
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
```

### Development server

```bash
pnpm dev -- --host 127.0.0.1 --port 4173
```

Open <http://127.0.0.1:4173/>. Direct `file://` loading is not supported because the app uses Vite's module environment.

### Automated tests

```bash
pnpm test:run
```

The suite covers the four-dilemma catalog and all twelve branches, domain transitions, revision and opaque-ID guards, idempotent consequence application, the Player/Agent capability boundary, WebMCP registration, localization keys, sound cues, and the end-to-end UI journey.

### Production build and local preview

```bash
pnpm build
pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort
```

The production deployment is configured to send:

```text
Origin-Agent-Cluster: ?1
Permissions-Policy: tools=(self)
```

## Verify WebMCP in Chrome

Use Chrome 149 or newer with the WebMCP testing implementation enabled. The project has been exercised specifically with Chrome 152 and the `WebMCPTesting` and `DevToolsWebMCPSupport` features.

1. Open `chrome://flags/#enable-webmcp-testing` and enable WebMCP testing.
2. Restart Chrome completely so the flag takes effect.
3. Start the local preview or open the HTTPS deployment.
4. Open DevTools → Application → WebMCP.
5. Confirm that all five registered tools listed above are discoverable.
6. Invoke `enter_machine_city`, then call `present_dilemma` with the returned `sessionId` and current `stateRevision` as `expectedRevision`.
7. Call `get_current_game_state` and confirm `AWAITING_HUMAN_SELECTION` with no tentative or confirmed decision.
8. Make the MIND–HAND–HEART selection in the Player UI. Only then should `present_choice_reflection` succeed with the real `tentativeSelectionId`.
9. Acknowledge and confirm in the Player UI. Only then should `reveal_confirmed_consequence` succeed with the real `confirmedDecisionId`.

DevTools' manual “Run tool” action is useful for contract inspection, but it should not be presented as proof of an agent-initiated call.

## Verify WebMCP in the ChatGPT in-app browser

The authoritative end-to-end proof should use one in-app browser session against the deployed HTTPS URL, so the page, registered tools, agent invocation, and visible UI all share the same origin and state.

1. Open [https://will-you-stay-human.vercel.app](https://will-you-stay-human.vercel.app) in the ChatGPT in-app browser and start from a fresh site session.
2. Confirm that the agent can discover the same five registered tools.
3. Ask the agent to call `enter_machine_city`, `present_dilemma`, and `get_current_game_state` in sequence, using each returned revision.
4. Select MIND, HAND, or HEART manually in the page.
5. Ask the agent to read the current state and call `present_choice_reflection` with the returned `sessionId`, `tentativeSelectionId`, and `stateRevision`.
6. Keep or change the direction, acknowledge the reflection, and confirm the final choice manually.
7. Ask the agent to call `reveal_confirmed_consequence` with the resulting `confirmedDecisionId` and current revision.
8. Verify that the consequence and Human Balance update appear in the same UI, and that a repeated reveal does not apply the delta twice.

If `document.modelContext` is unavailable, the optional `?inspector=1` development inspector can exercise the same `AgentCommandPort` locally. It is a diagnostic fallback, not evidence of WebMCP discovery or agent-initiated invocation.

## Current implementation

Implemented in this repository:

- single-player, four-round vertical slice;
- English and Hungarian presentation, with English as the first-visit default;
- four complete dilemmas and twelve MIND–HAND–HEART consequence branches;
- persistent session, cumulative outcome history, and Human Balance;
- separate player and agent capabilities enforced by ports and domain guards;
- five registered WebMCP tools with strict input schemas and structured results;
- optimistic revision checks and opaque selection/decision IDs;
- idempotent reflection and consequence delivery;
- cinematic Machine City journey at a tested 790 × 512 content viewport;
- restrained procedural Web Audio event cues, mute control, keyboard focus handling, and reduced-motion support;
- automated unit, content, WebMCP, boundary, sound, and UI regression tests.

## Current tabletop concept and future vision

The current release includes a **3D tabletop companion concept/prototype**: the box, foldable Human Balance and five markers shown in the separate `/product` reveal. It is not for sale and has not been validated for manufacturing.

The following ideas are future product directions only. They are not implemented:

- manufacturing validation, a commercial SKU, and a final physical product;
- family variants and QR/Companion Mode;
- multiplayer sessions;
- downloadable thematic and age-specific dilemma packs;
- continuously expandable online content;
- physical Human Tokens;
- a physical, wall-mounted Human Balance showing a group's cumulative delegation pattern.

Future group play would still avoid a “most human player” leaderboard. The Balance would compare delegation patterns and prompt discussion, not assign moral worth.

## Origin, assets, and licenses

This project is culturally and conceptually inspired by *Metropolis*. It is an independent work, is not an adaptation of the plot or characters, and has no official affiliation with or endorsement by the rights holders of *Metropolis*.

- Source code is released under the [MIT License](LICENSE).
- `machine-city-entry.png` and `machine-city-journey.png` were generated specifically for this project with OpenAI ImageGen from a user-approved visual brief.
- Event sounds are synthesized at runtime with the Web Audio API. No external audio files, narration, music, or sound libraries are bundled.
- The interface uses system font stacks; no third-party font files are redistributed.
- Direct runtime dependencies are React and React DOM (MIT), Zod (MIT), Phosphor Icons React (MIT), and Three.js (MIT).
- The new Machine City and companion geometries and animation are project-authored Blender assets; editable sources and Python recipes are included. The city-print surface illustration and wall background were generated for this project with OpenAI ImageGen. The landing silhouette reuses the original project image with an alpha mask; it is not a new 3D character. Texture provenance is retained in `assets/textures/`.
- Direct development dependencies include Vite and Vitest (MIT), Testing Library (MIT), TypeScript (Apache-2.0), and jsdom (MIT).
- Codex and OpenAI tools assisted with implementation, testing, visual generation, documentation, and iterative review. Product scope, copy, human-control rules, visual approvals, and release decisions remained under human direction.

## Repository guide

```text
src/domain/                 state machine, invariants, balance, and game records
src/application/            PlayerCommandPort, AgentCommandPort, and query views
src/infrastructure/webmcp/  strict schemas, handlers, and browser registration
src/content/                four-dilemma catalog and HU/EN presentation copy
src/ui/                     cinematic UI, Human Balance, sound, and locale state
tests/                      domain, content, boundary, WebMCP, sound, and UI tests
docs/                       architecture, human-control, testing, and evidence notes
public/assets/              project-specific Machine City images
```
