#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { McpServer } from '@modelcontextprotocol/server';
import { registerReviewTools } from './tools/reviews.js';
import { registerPublishingTools } from './tools/publishing.js';
import { registerReportingTools } from './tools/reporting.js';
import { registerListingTools, registerMonetizationTools } from './tools/listing.js';
import { registerPrompts } from './prompts.js';
import { registerResources } from './resources.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const version = pkg.version;

let shouldSetup = false;
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
  -s, --setup                  Verify configurations and test connectivity.
  -v, --version                Print the version of the MCP server.
  -h, --help                   Show this help message.

Environment Variables:
  GOOGLE_SERVICE_ACCOUNT_JSON   Raw JSON credentials.
  GOOGLE_APPLICATION_CREDENTIALS Path to service account key file.
  DEFAULT_PACKAGE_NAME          Default app package name.
`);
        process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
        console.log(version);
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
    } else if (arg === '--setup' || arg === '-s') {
        shouldSetup = true;
    }
}

const runSetup = async () => {
    console.error('=== Google Play Console MCP Setup Verification ===\n');

    let hasCredentials = false;
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const applicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (serviceAccountJson) {
        try {
            const credentials = JSON.parse(serviceAccountJson);
            console.error('1. Google Service Account JSON:');
            console.error('   [SUCCESS] Valid JSON credentials detected.');
            console.error(`   - Client Email: ${credentials.client_email || 'N/A'}`);
            console.error(`   - Project ID: ${credentials.project_id || 'N/A'}`);
            hasCredentials = true;
        } catch (err: any) {
            console.error('1. Google Service Account JSON:');
            console.error(`   [ERROR] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: ${err.message}`);
        }
    } else if (applicationCredentials) {
        console.error('1. Google Service Account JSON:');
        console.error(
            `   [INFO] Using credentials file from GOOGLE_APPLICATION_CREDENTIALS: ${applicationCredentials}`
        );
        try {
            if (fs.existsSync(applicationCredentials)) {
                const content = fs.readFileSync(applicationCredentials, 'utf8');
                const credentials = JSON.parse(content);
                console.error('   [SUCCESS] Valid JSON credentials file read.');
                console.error(`   - Client Email: ${credentials.client_email || 'N/A'}`);
                console.error(`   - Project ID: ${credentials.project_id || 'N/A'}`);
                hasCredentials = true;
            } else {
                console.error(`   [ERROR] Credentials file not found at: ${applicationCredentials}`);
            }
        } catch (err: any) {
            console.error(`   [ERROR] Failed to read/parse credentials file: ${err.message}`);
        }
    } else {
        console.error('1. Google Service Account JSON:');
        console.error('   [ERROR] No credentials found.');
        console.error('   Please configure Google Service Account credentials via one of these:');
        console.error('   - CLI Flag: --key-file / -k <path_to_file.json>');
        console.error('   - Environment Variable: GOOGLE_SERVICE_ACCOUNT_JSON');
        console.error('   - Environment Variable: GOOGLE_APPLICATION_CREDENTIALS');
    }

    console.error('\n2. Default Package Name:');
    if (process.env.DEFAULT_PACKAGE_NAME) {
        console.error(`   [SUCCESS] Default package name set to: "${process.env.DEFAULT_PACKAGE_NAME}"`);
    } else {
        console.error('   [INFO] No default package name configured.');
        console.error('   (You will need to pass package name parameter explicitly in each tool call.)');
    }

    if (hasCredentials) {
        console.error('\n3. Google OAuth Connectivity & Scopes Check:');
        console.error('   Authenticating with Google OAuth server...');
        try {
            const { getAuth } = await import('./auth.js');
            const { authClient } = await getAuth();
            const token = await authClient.getAccessToken();
            if (token && token.token) {
                console.error('   [SUCCESS] Authentication token successfully generated!');
                console.error('   - Scopes allowed: androidpublisher, playdeveloperreporting');
            } else {
                console.error('   [ERROR] Failed to fetch access token (empty response).');
            }
        } catch (err: any) {
            console.error(`   [ERROR] Authentication failed: ${err.message}`);
            console.error('   Double-check that your private key is valid and your system clock is synchronized.');
        }
    }

    console.error('\n=== Verification Complete ===');
};

if (shouldSetup) {
    await runSetup();
    process.exit(0);
}

/**
 * Play Console MCP Server
 *
 * Provides tools to interact with Google Play Console data via:
 * - Google Play Developer API (v3)
 * - Google Play Developer Reporting API (v1alpha1)
 */
const server = new McpServer(
    {
        name: 'Play Console MCP Server',
        version: version,
    },
    {
        instructions: `
This server connects to the Google Play Developer APIs to manage apps and monitor performance.

Tool Categories & Guidelines:

1. App Vitals & Analytics (Reporting API):
   - Always use 'query_crash_rate' and 'query_anr_rate' to retrieve stability metrics. Use these tools to perform automated app health checks.

2. User Feedback (Reviews API):
   - Use 'list_reviews' to fetch user reviews, and 'get_review' for detailed inspects.
   - Use 'reply_review' to respond to reviews. Note: Review replies have a strict 350-character limit.

3. Publishing & App Store Edits (Edits API):
   - Creating, staging, or editing app configurations requires an active edit transaction session.
   - Flow: Initialize an edit session using 'create_edit'. This returns an 'editId' (which expires in 48 hours).
   - Stage changes using the returned 'editId' with 'upload_aab' (App Bundles), 'update_store_listing' (localized text updates), and 'upload_store_image' / 'delete_store_image' (icons, banner, screenshots).
   - Use 'list_all_listings' to audit all localized store listings across languages.
   - Use 'get_app_details' to fetch and 'update_app_details' to modify app-wide contact info (email, phone, website, default language).
   - Associate the uploaded binaries to a release track using 'assign_track' (with the editId and target track name).
   - Use 'validate_edit' to verify all staged changes are consistent before finalizing.
   - Once all edits are completed and verified, call 'commit_edit' with the editId to save, commit, and send the release live or to review.

4. Release Tracks & App Status Retrieval:
   - Use 'list_tracks' to inspect all active release tracks (production, beta, alpha, internal) and see currently active releases.
   - Use 'get_track' to fetch detailed release notes, rollout percentages, and version codes for a specific track.
   - Use 'list_inapp_products' and 'list_subscriptions' to query configured catalog offerings.

General Guidelines:
- Always prefer using the 'DEFAULT_PACKAGE_NAME' configured in the environment if the 'packageName' parameter is omitted.
`,
    }
);

// Register all tool, prompt & resource modules
registerReviewTools(server);
registerPublishingTools(server);
registerReportingTools(server);
registerListingTools(server);
registerMonetizationTools(server);
registerPrompts(server);
registerResources(server);

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
