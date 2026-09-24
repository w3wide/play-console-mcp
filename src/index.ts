#!/usr/bin/env node
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

import { runMcpServer } from './cli/mcp.js';
import { runSetupCommand } from './cli/setup.js';
import {
    handleCreateEdit,
    handleUploadAab,
    handleAssignTrack,
    handleValidateEdit,
    handleCommitEdit,
    handleListTracks,
    handleGetTrack,
} from './cli/publishing.js';
import { handleListReviews, handleGetReview, handleReplyReview } from './cli/reviews.js';
import { handleQueryCrashRate, handleQueryAnrRate } from './cli/reporting.js';
import {
    handleGetStoreListing,
    handleUpdateStoreListing,
    handleListAllListings,
    handleUploadStoreImage,
    handleDeleteStoreImage,
    handleDeleteAllStoreImages,
    handleListStoreImages,
} from './cli/listing.js';
import { handleListInAppProducts, handleListSubscriptions } from './cli/monetization.js';

dotenv.config();

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const version = pkg.version;

function applyGlobalOptions(opts: { keyFile?: string; packageName?: string }) {
    if (opts.keyFile) {
        const val = opts.keyFile;
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
    }

    if (opts.packageName) {
        process.env.DEFAULT_PACKAGE_NAME = opts.packageName;
    }
}

const program = new Command();

program
    .name('play-console')
    .description('Google Play Console CLI & Stdio MCP Server')
    .version(version, '-v, --version', 'Print the version of the MCP server')
    .option('-k, --key-file <pathOrJson>', 'Path to Google Service Account JSON key file or raw JSON content')
    .option('-p, --package-name <name>', 'Default app package name')
    .option('--mcp', 'Start the Stdio MCP server for Google Play Console')
    .hook('preAction', () => {
        applyGlobalOptions(program.opts());
    })
    .action(async () => {
        await runMcpServer();
    });

program
    .command('mcp')
    .description('Start the Stdio MCP server for Google Play Console')
    .action(async () => {
        await runMcpServer();
    });

program
    .command('setup')
    .description('Verify configurations and test connectivity')
    .action(async () => {
        await runSetupCommand();
    });

const edit = program.command('edit').description('Manage Play Console draft edit sessions');

edit.command('create')
    .description('Create a new draft edit session')
    .action(async () => {
        await handleCreateEdit({});
    });

edit.command('upload-aab')
    .description('Upload an Android App Bundle (.aab)')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .requiredOption('--aab-path <path>', 'Path to .aab file')
    .action(async (options) => {
        await handleUploadAab({ editId: options.editId, aabPath: options.aabPath });
    });

edit.command('assign-track')
    .description('Assign version code to a release track')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .requiredOption('--track <name>', 'Track name (production, beta, alpha, internal)')
    .requiredOption('--version-code <codeOrNumber>', 'Version code')
    .option('--user-fraction <fraction>', 'User fraction for staged rollout')
    .option('--status <status>', 'Release status (completed, draft, halted, inProgress)', 'completed')
    .action(async (options) => {
        await handleAssignTrack({
            editId: options.editId,
            track: options.track,
            versionCode: parseInt(options.versionCode, 10),
            userFraction: options.userFraction ? parseFloat(options.userFraction) : undefined,
            status: options.status,
        });
    });

edit.command('validate')
    .description('Validate a draft edit session')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .action(async (options) => {
        await handleValidateEdit({ editId: options.editId });
    });

edit.command('commit')
    .description('Commit a draft edit session')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .action(async (options) => {
        await handleCommitEdit({ editId: options.editId });
    });

const tracks = program.command('tracks').description('Manage release tracks');

tracks
    .command('list')
    .description('List all release tracks in active edit session')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .action(async (options) => {
        await handleListTracks({ editId: options.editId });
    });

tracks
    .command('get')
    .description('Get details for a specific release track')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .requiredOption('--track <name>', 'Track name')
    .action(async (options) => {
        await handleGetTrack({ editId: options.editId, track: options.track });
    });

const reviews = program.command('reviews').description('Inspect and reply to user reviews');

reviews
    .command('list')
    .description('List recent user reviews')
    .option('--max-results <number>', 'Maximum results')
    .option('--start-index <number>', 'Start index')
    .option('--token <token>', 'Pagination token')
    .action(async (options) => {
        await handleListReviews({
            maxResults: options.maxResults ? parseInt(options.maxResults, 10) : undefined,
            startIndex: options.startIndex ? parseInt(options.startIndex, 10) : undefined,
            token: options.token,
        });
    });

reviews
    .command('get')
    .description('Get specific review by ID')
    .requiredOption('--review-id <id>', 'Review ID')
    .action(async (options) => {
        await handleGetReview({ reviewId: options.reviewId });
    });

reviews
    .command('reply')
    .description('Reply to a user review')
    .requiredOption('--review-id <id>', 'Review ID')
    .requiredOption('--reply-text <text>', 'Reply text (max 350 chars)')
    .action(async (options) => {
        await handleReplyReview({ reviewId: options.reviewId, replyText: options.replyText });
    });

const reporting = program.command('reporting').description('Query Android Vitals reporting metrics');

reporting
    .command('crash-rate')
    .description('Query daily crash rate metrics')
    .option('--start-date <YYYY-MM-DD>', 'Start date')
    .option('--end-date <YYYY-MM-DD>', 'End date')
    .action(async (options) => {
        await handleQueryCrashRate({ startDate: options.startDate, endDate: options.endDate });
    });

reporting
    .command('anr-rate')
    .description('Query daily ANR rate metrics')
    .option('--start-date <YYYY-MM-DD>', 'Start date')
    .option('--end-date <YYYY-MM-DD>', 'End date')
    .action(async (options) => {
        await handleQueryAnrRate({ startDate: options.startDate, endDate: options.endDate });
    });

const listing = program.command('listing').description('Manage store listings');

listing
    .command('get')
    .description('Get store listing for a language')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .requiredOption('--language <lang>', 'Language code')
    .action(async (options) => {
        await handleGetStoreListing({ editId: options.editId, language: options.language });
    });

listing
    .command('update')
    .description('Update store listing text')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .requiredOption('--language <lang>', 'Language code')
    .option('--title <title>', 'App title')
    .option('--short-description <desc>', 'Short description')
    .option('--full-description <desc>', 'Full description')
    .action(async (options) => {
        await handleUpdateStoreListing({
            editId: options.editId,
            language: options.language,
            title: options.title,
            shortDescription: options.shortDescription,
            fullDescription: options.fullDescription,
        });
    });

listing
    .command('list-all')
    .description('List all store listings for edit session')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .action(async (options) => {
        await handleListAllListings({ editId: options.editId });
    });

const images = program.command('images').description('Manage store listing images');

images
    .command('upload')
    .description('Upload store listing image')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .requiredOption('--image-type <type>', 'Image type (icon, featureGraphic, phoneScreenshots, etc.)')
    .requiredOption('--image-path <path>', 'Path to image file')
    .requiredOption('--language <lang>', 'Language code')
    .action(async (options) => {
        await handleUploadStoreImage({
            editId: options.editId,
            imageType: options.imageType,
            imagePath: options.imagePath,
            language: options.language,
        });
    });

images
    .command('delete')
    .description('Delete a store listing image')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .requiredOption('--image-type <type>', 'Image type')
    .requiredOption('--image-id <id>', 'Image ID')
    .requiredOption('--language <lang>', 'Language code')
    .action(async (options) => {
        await handleDeleteStoreImage({
            editId: options.editId,
            imageType: options.imageType,
            imageId: options.imageId,
            language: options.language,
        });
    });

images
    .command('delete-all')
    .description('Delete all store listing images of a type')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .requiredOption('--image-type <type>', 'Image type')
    .requiredOption('--language <lang>', 'Language code')
    .action(async (options) => {
        await handleDeleteAllStoreImages({
            editId: options.editId,
            imageType: options.imageType,
            language: options.language,
        });
    });

images
    .command('list')
    .description('List store listing images')
    .requiredOption('--edit-id <id>', 'Edit session ID')
    .requiredOption('--image-type <type>', 'Image type')
    .requiredOption('--language <lang>', 'Language code')
    .action(async (options) => {
        await handleListStoreImages({
            editId: options.editId,
            imageType: options.imageType,
            language: options.language,
        });
    });

const inapp = program.command('inapp').description('Manage in-app products');

inapp
    .command('list')
    .description('List in-app products')
    .action(async () => {
        await handleListInAppProducts({});
    });

const subscriptions = program.command('subscriptions').description('Manage active subscriptions');

subscriptions
    .command('list')
    .description('List active subscriptions')
    .action(async () => {
        await handleListSubscriptions({});
    });

program.parseAsync(process.argv);
