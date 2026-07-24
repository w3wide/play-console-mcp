# Play Console MCP Server

A Model Context Protocol (MCP) server for Google Play Console API integration. This server provides tools to manage app releases, read and reply to user reviews, query Android Vitals (crashes and ANRs), and manage store listing metadata.

Built with the TypeScript MCP SDK and the Google Play Developer APIs.

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

## Prerequisites

1. **Google Cloud Project**: Enable the following APIs:
   * Google Play Developer API
   * Google Play Developer Reporting API
2. **Service Account**: Create a service account in your Google Cloud Project, download the JSON key file, and invite the service account email to your Google Play Console under "Users and permissions" with appropriate access (e.g. Manage Releases, View App Information).

## Configuration

You can configure the server using environment variables, a `.env` file, or command-line arguments.

```env
# Path to the Google Service Account JSON key file
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# Or the raw JSON credentials content
GOOGLE_SERVICE_ACCOUNT_JSON='{"type": "service_account", ...}'

# Default app package name to use if omitted in tool calls
DEFAULT_PACKAGE_NAME=com.your.app.id
```

## Getting Started

### Installation

```bash
npm install
npm run build
```

### Start Server

```bash
npm start
```

## Testing

### 1. MCP Inspector
The MCP Inspector is a utility to test MCP servers interactively.

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

This starts a local web console (typically on `http://localhost:6274`) to list tools, enter arguments, and run requests.

### 2. CLI Smoke Test
Send a JSON-RPC tools listing payload to check that the server starts and registers all tools:

```bash
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node build/index.js
```

## Adding to AI Agents

You can run this server directly via `npx` or using local build paths.

### 1. Claude Code
Run the following command in your terminal:

```bash
# Using NPX (Recommended)
claude mcp add play-console-mcp "npx -y @w3wide/play-console-mcp -k /path/to/key.json -p com.your.app.id"

# Using local path
claude mcp add play-console-mcp "node /absolute/path/to/play-console-mcp/build/index.js"
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
  * `playdeveloperreporting:v1beta1` (Android Vitals reporting)
* **Transport**: Stdio (Standard Input/Output)

## Security

This server uses official Google Cloud client libraries. Do not commit `.env` or service account JSON files to version control.
