# Orator

A web-based slide presentation tool built with Electron, Bun, and Remix Components.

Each conference talk is a workspace package that imports shared libraries to define slides as TSX components.

## Getting Started

```bash
bun install
bun run dev:desktop
```

## Packages

- `@orator/desktop` — Electron app shell
- `@orator/app` — Styled presentation components
- `@orator/ui` — Headless UI components
- `@orator/core` — Domain models and navigation logic
- `@orator/utils` — Shared utilities
- `@orator/react-miami-2026` — React Miami 2026 talk
