# Approved spatial release checkpoint

Iterations 1–8 and the separate product reveal are the approved visual baseline. This checkpoint packages that work; it does not introduce a new journey or redesign.

## Entry points

- `/play`: approved spatial game, including the Blender-backed Human Balance.
- `/product`: separate companion reveal; its existing final CTA links to `/play`.
- `/`: original entry retained. Existing review query URLs remain compatible.

The README exposes both public destinations for Product Hunt linking. They must be checked on HTTPS production after explicit deployment approval; a successful local build is not production QA.

## Physical product status

The box, foldable Human Balance and five markers are a physical companion concept/prototype. The assets are not manufacturing-validated and do not represent a purchasable finished product. No new lifestyle scene or marketing render is required for this release.

## Included work

- Blender Machine City opening and the approved dilemma, selection, reflection, explicit human confirmation, consequence and Human Balance sequence.
- Separate box → interior → folded companion → unfolding product reveal, with frozen copy.
- Editable `.blend` sources, optimized GLB exports, texture provenance, authoring scripts and regression tests.
- Minimal public route aliases and deployment rewrites; no domain, WebMCP, score, session or history changes.

The test suite uses `docs/evidence/product-reveal/packaging-fit.json` and `docs/evidence/phase3-product-depth/human-balance-asset-report.json`; these are included as reproducible test inputs. Older review captures, frame sequences, Blender backup files and local scratch artifacts are not release inputs and are not packaged for deployment.

## Required production QA after deployment

- Fresh English game on `/play`: intro → first dilemma → selection → reflection → explicit human confirmation → consequence → Human Balance.
- Change-choice navigation, CTA visibility, five domain-backed marker animations; desktop and narrow mobile viewport.
- `/product`: complete box/interior/fold/unfold sequence and final game link.
- GLB and raster requests succeed; no renderer or browser console errors.
- Five registered WebMCP tools and a genuine authorized agent invocation. Human-only choices and final confirmation must remain human actions for live evidence.

Production QA is pending. A local test pass does not certify the deployment or real-device mobile GPU performance.

## Preflight result — 2026-09-17

- 193 tests passed in 24 files, including public-route regression coverage.
- Production build and `git diff --check` passed.
- An isolated copy made only from staged files passed the same tests and build, using the existing installed dependency set (not a fresh network dependency installation).
- All five GLB files match their built counterparts by SHA-256. The local `/play` route loads the Blender result; `/product` loads the reveal without query parameters.
- Common credential-pattern scan of staged files reported no matches; this is not a comprehensive security audit.
- Vercel authentication and the existing `will-you-stay-human` project are available; project Node is 24.x. Repository configuration explicitly selects Vite, `pnpm build` and `dist`.
- Known non-blocking build warning: the separately loaded Three.js chunk is approximately 631 kB before gzip. Real-device mobile performance still requires release QA.
- No push or deployment was performed during preflight. Production QA above remains pending.
