# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Snapshot

- Product: local-first desktop Markdown editor + knowledge base.
- Stack: Tauri 2 (Rust) + React 19 + TypeScript + Vite + Tailwind 4 + Zustand.
- Source of truth docs:
  - Overview and setup: [README.md](README.md)
  - Contribution process: [CONTRIBUTING.md](CONTRIBUTING.md)
  - Security policy: [SECURITY.md](SECURITY.md)
  - Roadmap context: [ROADMAP.md](ROADMAP.md)
  - Performance notes: [PERFORMANCE_EVALUATION.md](PERFORMANCE_EVALUATION.md), [PERFORMANCE_DATA_RECORD.md](PERFORMANCE_DATA_RECORD.md)

## Working Agreement

- Keep changes minimal and scoped to the user request.
- Do not refactor unrelated modules.
- Prefer existing utilities, hooks, and store patterns over introducing new abstractions.
- Preserve path alias usage (`@/...`) for frontend imports.
- Do not modify generated/large output folders (`dist`, `src-tauri/target`) unless explicitly asked.

## Common Commands

- Install deps: `pnpm install`
- Frontend dev only: `pnpm dev:vite`
- Full desktop dev (Tauri): `pnpm dev`
- Frontend build: `pnpm build:vite`
- Desktop build: `pnpm build`
- Lint: `pnpm lint`
- Format check/fix: `pnpm check` / `pnpm fix`
- Tests: `pnpm test` (currently placeholder; no real test suite wired)

## Architecture Map

- Frontend entry:
  - App bootstrap: [src/main.tsx](src/main.tsx)
  - Main shell: [src/App.tsx](src/App.tsx)
- Frontend domains:
  - Editor/UI: [src/components/editor/](src/components/editor/)
  - Knowledge base/chat: [src/components/kb/](src/components/kb/)
  - Graph view: [src/components/graph/](src/components/graph/)
  - Global state (Zustand): [src/stores/](src/stores/)
  - Hooks/utilities: [src/hooks/](src/hooks/), [src/utils/](src/utils/)
- Desktop backend:
  - Tauri bootstrap/plugin wiring: [src-tauri/src/lib.rs](src-tauri/src/lib.rs)
  - Tauri commands: [src-tauri/src/commands/](src-tauri/src/commands/)

## Conventions That Matter

- Formatting/linting uses Biome 2 with 2-space indentation and double quotes.
  - Config: [biome.json](biome.json)
- `src/components/ui` is excluded from Biome includes; avoid bulk style rewrites there unless required.
- Vite alias `@ -> src` is standard.
  - Config: [vite.config.ts](vite.config.ts), [tsconfig.json](tsconfig.json)
- Keep editor-related changes aligned with existing modular split (extensions/menubar/bubble menu/sidebar) under [src/components/editor/](src/components/editor/).
- When adding Rust command capabilities, expose through `invoke_handler` and keep command grouping in [src-tauri/src/commands/](src-tauri/src/commands/).

## Environment and CI Notes

- CI uses Node 24 and pnpm 9.
  - Workflow: [.github/workflows/release.yml](.github/workflows/release.yml)
- App runtime behavior includes tray/minimize and deep-link/file-open flows in Rust; be careful with window lifecycle changes.
  - See [src-tauri/src/lib.rs](src-tauri/src/lib.rs)

## Preferred Agent Workflow

1. Read related docs first (link above), then inspect nearest feature folder.
2. Implement the smallest change that solves the request.
3. Run targeted validation (`pnpm lint` and/or `pnpm check`; run build when touching config/build paths).
4. Report what changed, validation performed, and any remaining risk.
