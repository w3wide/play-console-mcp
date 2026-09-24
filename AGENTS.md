# AGENTS.md — Developer & AI Agent Guide for `play-console-mcp`

Welcome to `@w3wide/play-console-mcp`. This document provides essential project context, architectural guidelines, authentication configurations, development workflows, and tool specifications for AI agents and human developers working in this repository.

---

## 1. Project Overview & Architecture

`@w3wide/play-console-mcp` is an MCP (Model Context Protocol) server implemented in Node.js / TypeScript. It enables LLMs (such as Claude, Cursor, Gemini) to directly interact with Google Play Console APIs to manage Android application releases, store listings, reviews, and vital performance metrics.

### Under the Hood
- **Google Play Developer API (`v3`)**: Used for managing app release tracks, uploading `.aab` binaries, updating store listings/images, responding to user reviews, and querying monetization catalogs.
- **Google Play Developer Reporting API (`v1alpha1`)**: Used for querying Android Vitals metrics (daily crash rates and ANR rates).
- **MCP Core (`@modelcontextprotocol/server`)**: Stdio-based MCP server integration exposing tools, resources, and prompts.

---

## 2. Directory Structure

```
play-console-mcp/
├── src/
│   ├── index.ts          # CLI entrypoint, CLI argument parser, setup verification, server bootstrap
│   ├── auth.ts           # Google Service Account authentication & OAuth token scope management
│   ├── utils.ts          # Default package name handler, standardized wrapError troubleshooting advice
│   ├── prompts.ts        # MCP prompts (app_health_audit, release_preparation, etc.)
│   ├── resources.ts      # MCP resources (app_details, store_listing, inapp_products_catalog)
│   └── tools/            # Modular MCP tool definitions
│       ├── publishing.ts # Edits API lifecycle, track management, AAB upload, app details
│       ├── reviews.ts    # Fetch, inspect, and reply to user reviews
│       ├── reporting.ts  # Android Vitals crash rate & ANR rate querying
│       └── listing.ts    # Store listing texts, image assets, Data Safety CSV, monetization catalogs
├── tests/                # Unit and integration test suites
├── build/                # Compiled JavaScript output (generated via npm run build)
├── package.json          # Dependencies, scripts, and package metadata
├── tsconfig.json         # TypeScript compiler configuration
└── EXAMPLES.md           # Usage examples for MCP client integration
```

---

## 3. Environment & Authentication Setup

Authentication relies on a **Google Cloud Service Account** with access to the target Google Play Console account.

### Required OAuth Scopes
- `https://www.googleapis.com/auth/androidpublisher`
- `https://www.googleapis.com/auth/playdeveloperreporting`

### Credential Configuration Methods
1. **Environment Variables**:
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: Raw JSON string of the service account credentials.
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to the service account JSON key file.
   - `DEFAULT_PACKAGE_NAME` (optional): Default Android package name (e.g., `com.example.app`).
2. **CLI Option**: `--key-file` / `-k` path to key file.
3. **Interactive Setup Wizard**: Run `play-console setup` to configure key file and default package name permanently in `~/.config/play-console/config.json`.
4. **Diagnostic Doctor Check**: Run `play-console doctor` to verify credentials, key file, and scope access.
5. **Configuration Management**: Run `play-console config <show|set|get|unset>` to manage saved settings.

### Dual Executable Binaries
- `play-console`: Primary CLI entry point supporting direct subcommand execution (`play-console <command> <subcommand>`) as well as starting the MCP server (`play-console mcp`).
- `play-console-mcp`: Stdio MCP server alias binary.

### CLI-First Usage
Developers and automated agents can run commands directly without invoking an interactive MCP session:
```bash
play-console setup
play-console doctor
play-console config show
play-console edit create
play-console tracks list
play-console reviews list
play-console reporting crashes
play-console listing get --language en-US
play-console mcp
```

---

## 4. Development & Build Commands

- **Build**: `npm run build` (`tsc && chmod +x build/index.js`)
- **Start MCP**: `npm run start` (`node build/index.js mcp`)
- **Dev**: `npm run dev -- mcp` (`ts-node-esm src/index.ts mcp`)
- **Run Tests**: `npm run test` (`node --experimental-vm-modules node_modules/jest/bin/jest.js`)
- **Lint**: `npm run lint` (`eslint "src/**/*.ts"`)
- **Format**: `npm run format` (`prettier --write "src/**/*.ts"`)

---

## 5. Core Concepts & Conventions

### Transactional Edit Session Pattern
Modifications to app releases, tracks, store listings, and assets use Google's **Edits API**:
1. `create_edit`: Starts a draft edit session (returns `editId`, valid for 48 hours).
2. Staging actions (`upload_aab`, `assign_track`, `update_store_listing`, `upload_store_image`): Use `editId` to modify the staged draft.
3. `validate_edit` (optional): Validates the draft session.
4. `commit_edit`: Commits the session, pushing changes live or into Google Play review queue.

### Error Handling Standard
Errors must be processed using `wrapError(error, context)` in `src/utils.ts`. This standardizes responses and adds actionable tips for status codes:
- **403**: Permission missing in Play Console for the service account.
- **404**: Package name or resource not found.
- **429**: API rate limit or quota exceeded.
- **400**: Invalid parameters or invalid edit ID session.

---

## 6. Registered MCP Tools Overview

### App Vitals & Reporting
- `query_crash_rate`: Query daily crash percentage metrics.
- `query_anr_rate`: Query daily ANR (App Not Responding) rate statistics.

### Reviews & Feedback
- `list_reviews`: Fetch recent user reviews with ratings, comments, and device info.
- `get_review`: Get specific review details by `reviewId`.
- `reply_review`: Post/update developer reply (max 350 chars).

### Release Management & Publishing
- `create_edit`: Start draft edit session.
- `upload_aab`: Upload Android App Bundle (`.aab`) file.
- `assign_track`: Assign version code to release track (`production`, `beta`, `alpha`, `internal`).
- `get_track`: Get track release details.
- `list_tracks`: List all tracks in active edit session.
- `validate_edit`: Validate staged edit session.
- `commit_edit`: Commit staged changes.
- `get_app_details`: Get app contact details and language.
- `update_app_details`: Update app contact details.

### Store Listing & Assets
- `get_store_listing`: Fetch localized title, short description, full description.
- `update_store_listing`: Update localized title (max 50 chars), short desc (max 80 chars), full desc (max 4000 chars).
- `list_all_listings`: List metadata across all configured languages.
- `upload_store_image`: Upload icon, feature graphic, or screenshots.
- `delete_store_image`: Delete specific image by `imageId`.
- `delete_all_store_images`: Delete all images of a specified type.
- `list_store_images`: List store images for a specific type and language.
- `update_data_safety`: Upload Data Safety declaration CSV content.

### Monetization
- `list_inapp_products`: List in-app one-time products.
- `list_subscriptions`: List active subscriptions catalog.
