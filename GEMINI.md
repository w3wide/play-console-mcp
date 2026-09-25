@AGENTS.md reference one

# GEMINI.md — Gemini Agent Operational Rules & Context

This file provides specific operational guidelines for Gemini AI agents (including Google Antigravity) working on `@w3wide/play-console-mcp`.

---

## 1. Core Instructions & Behavior

- **Reference Architecture**: Always consult [@AGENTS.md](file:///home/hasrat/WebstormProjects/play-console-mcp/AGENTS.md) first for the project overview, authentication patterns, edit session lifecycles, and tool schemas.
- **Code Modification Safety**:
  - Always run `npm run build` after editing TypeScript files under `src/` to ensure clean compilation.
  - Run `npm run test` or `npm run lint` before completing any code changes.
  - Wrap any new API handlers or tool callbacks with `wrapError()` from `src/utils.ts`.
- **Tool Registrations**:
  - Modular tool files reside in `src/tools/`. When adding or updating a tool, register it in the appropriate modular file and export it properly for initialization in `src/index.ts`.
  - Validate parameters strictly using `zod` schemas.

---

## 2. Executable Binaries & CLI-First Commands

- **Dual Binaries**: `play-console` (CLI & MCP entrypoint) and `play-console-mcp` (Stdio MCP server alias binary).
- **CLI-First Syntax**: `play-console <command> <subcommand>` (e.g. `play-console setup`, `play-console reviews list`, `play-console edit create`) or `play-console mcp` for MCP stdio server mode.

---

## 3. Quick Command Reference

```bash
# Build project
npm run build

# Run unit tests
npm run test

# Run ESLint check
npm run lint

# Format codebase with Prettier
npm run format

# Run interactive setup wizard
npm run dev -- setup

# Run interactive release wizard
npm run dev -- wizard

# Run diagnostic health check
npm run dev -- doctor

# Test CLI commands directly
node build/index.js setup
node build/index.js wizard
node build/index.js doctor
node build/index.js reviews list
node build/index.js mcp
```
