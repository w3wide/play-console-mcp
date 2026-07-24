#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerReviewTools } from './tools/reviews.js';
import { registerPublishingTools } from './tools/publishing.js';
import { registerReportingTools } from './tools/reporting.js';
import { registerListingTools, registerMonetizationTools } from './tools/listing.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help' || arg === '-h') {
    console.error(`
Play Console MCP Server

Usage:
  npx @w3wide/play-console-mcp [options]

Options:
  -k, --key-file <path|json>   Path to Google Service Account JSON key file or raw JSON content.
  -p, --package-name <name>    Default app package name to use if omitted in tool calls.
  -h, --help                   Show this help message.

Environment Variables:
  GOOGLE_SERVICE_ACCOUNT_JSON   Raw JSON credentials.
  GOOGLE_APPLICATION_CREDENTIALS Path to service account key file.
  DEFAULT_PACKAGE_NAME          Default app package name.
`);
    process.exit(0);
  } else if (arg === '--key-file' || arg === '-k') {
    const val = args[++i];
    if (!val) {
      console.error('Error: Missing value for --key-file / -k');
      process.exit(1);
    }
    if (val.trim().startsWith('{')) {
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON = val;
    } else {
      try {
        const absolutePath = path.resolve(val);
        if (!fs.existsSync(absolutePath)) {
          console.error(`Error: Key file not found at ${absolutePath}`);
          process.exit(1);
        }
        process.env.GOOGLE_SERVICE_ACCOUNT_JSON = fs.readFileSync(absolutePath, 'utf8');
      } catch (err: any) {
        console.error(`Error reading key file: ${err.message}`);
        process.exit(1);
      }
    }
  } else if (arg === '--package-name' || arg === '-p') {
    const val = args[++i];
    if (!val) {
      console.error('Error: Missing value for --package-name / -p');
      process.exit(1);
    }
    process.env.DEFAULT_PACKAGE_NAME = val;
  }
}


/**
 * Play Console MCP Server
 * 
 * Provides tools to interact with Google Play Console data via:
 * - Google Play Developer API (v3)
 * - Google Play Developer Reporting API (v1beta1)
 */
const server = new McpServer(
  {
    name: 'Play Console MCP Server',
    version: '2.0.0',
  },
  {
    instructions: `
This server connects to the Google Play Developer APIs to manage apps and monitor performance.

Key Guidelines:
1. Always prefer using 'DEFAULT_PACKAGE_NAME' from environment if 'packageName' is omitted.
2. For publishing changes, follow the sequence: create_edit -> (upload_aab/update_store_listing) -> assign_track -> commit_edit.
3. Edits are ephemeral and expire after 48 hours. Always create a new one for a new task.
4. When checking app health, use 'query_crash_rate' and 'query_anr_rate' from the Reporting API.
5. Review replies have a 350-character limit.
`,
  }
);

// Register all tool modules
registerReviewTools(server);
registerPublishingTools(server);
registerReportingTools(server);
registerListingTools(server);
registerMonetizationTools(server);

/**
 * Main entry point.
 * Currently supports Stdio transport for local agents.
 */
async function run() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Play Console MCP Server (v2.0.0) running on stdio');
  } catch (error) {
    console.error('Fatal error in Play Console MCP Server:', error);
    process.exit(1);
  }
}

run();
