import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { McpServer } from '@modelcontextprotocol/server';
import { registerReviewTools } from '../tools/reviews.js';
import { registerPublishingTools } from '../tools/publishing.js';
import { registerReportingTools } from '../tools/reporting.js';
import { registerListingTools, registerMonetizationTools } from '../tools/listing.js';
import { registerPrompts } from '../prompts.js';
import { registerResources } from '../resources.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');
const version = pkg.version;

export async function runMcpServer(): Promise<void> {
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

    try {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error(`Play Console MCP Server (v${version}) running on stdio`);
    } catch (error) {
        console.error('Fatal error in Play Console MCP Server:', error);
        process.exit(1);
    }
}
