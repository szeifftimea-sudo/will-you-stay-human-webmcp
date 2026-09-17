# AI Usage

## Codex

| Date | Model/tool | Task | AI output | Human decisions and verification |
|---|---|---|---|---|
| 2026-08-27 | Codex, exact model determined by the runtime environment | Technical-plan consistency review, project scaffold, and spike implementation | Documentation, code, tests, and commit proposals | The project owner set the scope, approved plan 0.3, defined the human-control boundary, and explicitly authorized implementation. |

AI-generated changes were followed by automated tests, build and diff/status checks, and documented manual verification. Git commits use the repository-local author `Codex Agent <codex-agent@local.invalid>` so machine execution is not presented as human authorship.

The repository does not include private prompt logs, API keys, personal data, or the local inspiration PDF.

## GPT-6 Astra-assisted V2

The V1 premise, core product logic, and WebMCP architecture existed before Astra. GPT-6 Astra was used in Codex to further develop V2, primarily through spatial and 3D product implementation, iteration, and testing.

**Astra did not define the product thesis; it helped turn an existing hybrid product vision into editable 3D assets, a spatial web experience and an iteratively tested V2 implementation.**

Editable Blender source files created or advanced with Astra support during V2 include:

- `assets/blender/machine-city-landing.blend`
- `assets/blender/machine-city-landing-depth.blend`
- `assets/blender/human-balance.blend`
- `assets/blender/companion-product-box.blend`
- `assets/blender/product-reveal-animated.blend`

The related work covered:

- 3D Machine City;
- spatial landing and presentation;
- the Human Balance 3D model;
- the physical companion box;
- the foldable Human Balance concept;
- product-reveal animation;
- Blender camera, lighting, depth, and material work;
- procedural Blender scripting;
- browser-ready GLB exports;
- React / Three.js integration;
- iterative implementation, visual review, and testing.

The product concept and direction, the MIND / HAND / HEART model, the meaning of the Human Balance and its five dimensions, the human–agent authority boundary, visual accept/reject decisions, iteration priorities, final UX decisions, and review and approval of Astra-assisted work remained human-owned. Astra did not autonomously design the product.

The final launch assets are the approved `/play` journey, the `/product` reveal, and their accepted source assets. The lifestyle closure and bedside scene were rejected during review and are **not part of the launch**; they remain post-launch ideas only.
