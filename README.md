# Play Console MCP Server

A Model Context Protocol (MCP) server for Google Play Console API integration. This server provides tools to manage app releases, read and reply to user reviews, query Android Vitals (crashes and ANRs), and manage store listing metadata.

Built with the TypeScript MCP SDK and the Google Play Developer APIs.

## Installation

### Global Installation (Recommended for CLI & MCP)
```bash
npm install -g @w3wide/play-console-mcp
```

### Local / Development Setup
```bash
git clone https://github.com/w3wide/play-console-mcp.git
cd play-console-mcp
npm install
npm run build
```

## Quick Start & Setup Wizard

Once installed, run the interactive setup wizard to configure your credentials:

```bash
play-console setup
```

Run diagnostic doctor check to verify connection:

```bash
play-console doctor
```

## Prerequisites

1. **Google Cloud Project**: Enable the following APIs:
   * Google Play Developer API
   * Google Play Developer Reporting API
2. **Service Account**: Create a service account, download its JSON key file, and link it in the Google Play Console under **Users and permissions**.
   * 👉 For step-by-step instructions on setting up credentials, scopes, and Play Store permissions, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

## Features and Tools

Available tools are grouped by function:

### Stability and Vitals (Reporting API)
Query application stability metrics using the Google Play Developer Reporting API.
* `query_crash_rate`: Get the crash rate (percentage of daily active users experiencing a crash).
* `query_anr_rate`: Get the App Not Responding (ANR) rate.

### Reviews and Feedback
Query and respond to user reviews.
* `list_reviews`: Fetch recent reviews with rating, device info, and user comments.
* `get_review`: Fetch details for a specific review.
* `reply_review`: Post or update a reply to a user review (350 character limit).

### Publishing and Releases
Manage release workflows.
* `create_edit`: Start a new transaction/edit (expires after 48 hours).
* `upload_aab`: Upload an Android App Bundle (.aab file) to the active edit.
* `assign_track`: Assign the uploaded bundle to a release track (production, beta, alpha, internal).
* `commit_edit`: Save and commit the active edit to apply all changes.

### Store Listing and Monetization
Update listing content and query products.
* `get_store_listing`: Get localized title and descriptions for a specific language.
* `update_store_listing`: Update title, short description, and full description for a language.
* `update_data_safety`: Update the Data Safety declaration.
* `list_inapp_products`: List one-time purchase catalog products.
* `list_subscriptions`: List in-app subscription plans.

### Prompts
Pre-configured workflows to guide AI agents and users:
* `app_health_audit`: Audit Android Vitals (crashes and ANR rates) and generate a health summary report.
* `release_preparation`: Interactive step-by-step workflow guide to stage, validate, and commit a release build.
* `review_response_assistant`: Fetch user reviews, filter negative/unanswered feedback, and draft professional replies under 350 characters.
* `store_listing_optimizer`: Inspect localized store listings and suggest ASO-optimized titles and descriptions.

### Resources
Read-only URI data context sources for AI agents:
* `playconsole://apps/{packageName}/details`: Retrieve app contact email, phone, website, and default language.
* `playconsole://apps/{packageName}/listings/{language}`: Read localized store listing title and descriptions.
* `playconsole://apps/{packageName}/inapp-products`: Fetch configured in-app products catalog data.

## Configuration

You can configure the server using environment variables, a `.env` file, command-line arguments, or saved config.

```env
# Path to the Google Service Account JSON key file
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# Or the raw JSON credentials content
GOOGLE_SERVICE_ACCOUNT_JSON='{"type": "service_account", ...}'

# Default app package name to use if omitted in tool calls
DEFAULT_PACKAGE_NAME=com.your.app.id
```

## Executable Binaries & CLI Usage

This package provides dual executable binaries:
- `play-console`: Primary CLI entry point supporting direct subcommand execution (`play-console <command> <subcommand>`) as well as launching the MCP server (`play-console mcp`).
- `play-console-mcp`: Stdio MCP server alias binary designed for AI agent integration.

### CLI-First Commands

Execute Google Play Console operations directly from your terminal:

```bash
# 1. Interactive Setup Wizard (configures & saves to ~/.config/play-console/config.json)
play-console setup

# 2. Interactive Release Wizard (guided step-by-step AAB upload & publishing)
play-console wizard
# or
play-console edit wizard

# 3. Diagnostic Doctor Check (tests key file, package name & API scopes)
play-console doctor

# 4. View or edit persistent configuration
play-console config show
play-console config set packageName com.your.app.id

# 5. Direct CLI Operations (Flagless execution once setup is complete)
play-console reviews list
play-console reporting crash-rate
play-console edit create
play-console tracks list
play-console listing get --language en-US
play-console images list --image-type icon --language en-US
play-console inapp list
play-console subscriptions list

# Explicitly start the Stdio MCP Server
play-console mcp
# or using the dedicated binary:
play-console-mcp
```

## Testing

### 1. MCP Inspector
The MCP Inspector is a utility to test MCP servers interactively.

```bash
npx @modelcontextprotocol/inspector node build/index.js mcp
```

This starts a local web console (typically on `http://localhost:6274`) to list tools, enter arguments, and run requests.

### 2. CLI Smoke Test
Send a JSON-RPC tools listing payload to check that the server starts and registers all tools:

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node build/index.js mcp
```

## Adding to AI Agents

You can run this server directly via `npx` or using local build paths.

### 1. Claude Code
Run the following command in your terminal:

```bash
# Using NPX (Recommended)
claude mcp add play-console-mcp "npx -y @w3wide/play-console-mcp mcp -k /path/to/key.json -p com.your.app.id"

# Using local path
claude mcp add play-console-mcp "node /absolute/path/to/play-console-mcp/build/index.js mcp"
```

### 2. Claude Desktop
Add this to your `claude_desktop_config.json`:

#### Option A: Using NPX (Recommended)
```json
{
  "mcpServers": {
    "play-console": {
      "command": "npx",
      "args": [
        "-y",
        "@w3wide/play-console-mcp",
        "--key-file",
        "/path/to/key.json",
        "--package-name",
        "com.your.app.id"
      ]
    }
  }
}
```

#### Option B: Using local build
```json
{
  "mcpServers": {
    "play-console": {
      "command": "node",
      "args": ["/absolute/path/to/play-console-mcp/build/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/key.json",
        "DEFAULT_PACKAGE_NAME": "com.your.app.id"
      }
    }
  }
}
```

## Architecture Details

* **Framework**: Node.js and TypeScript
* **SDK**: `@modelcontextprotocol/sdk` (McpServer client)
* **APIs**:
  * `androidpublisher:v3` (App releases and catalog management)
  * `playdeveloperreporting:v1alpha1` (Android Vitals reporting)
* **Transport**: Stdio (Standard Input/Output)

## Security

This server uses official Google Cloud client libraries. Do not commit `.env` or service account JSON files to version control.
