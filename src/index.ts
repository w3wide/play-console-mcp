#!/usr/bin/env node
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';

import { runMcpServer } from './cli/mcp.js';
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

/**
 * Adds global authentication & configuration options (-k, -p) to a command.
 */
function withGlobalOptions(cmd: Command): Command {
    return cmd
        .option('-k, --key-file <pathOrJson>', 'Path to Google Service Account JSON key file or raw JSON content')
        .option('-p, --package-name <name>', 'Default app package name (e.g. com.example.app)')
        .hook('preAction', (thisCommand) => {
            applyGlobalOptions(thisCommand.opts());
        });
}

const program = new Command();

program
    .name('play-console')
    .description('Google Play Console CLI & Stdio MCP Server')
    .version(version, '-v, --version', 'Print the version of play-console-cli')
    .option('--mcp', 'Start the Stdio MCP server for Google Play Console');

withGlobalOptions(program)
    .addHelpText(
        'after',
        `
Examples:
  $ play-console setup -k /path/to/service-account.json
  $ play-console reviews list -p com.example.app
  $ play-console reporting crash-rate -p com.example.app --start-date 2026-01-01
  $ play-console edit create -p com.example.app
  $ play-console mcp
`
    )
;

import { runInteractiveSetup } from './cli/setup.js';
import { runDoctorCommand } from './cli/doctor.js';
import { handleConfigShow, handleConfigGet, handleConfigSet, handleConfigUnset } from './cli/config.js';

withGlobalOptions(
    program
        .command('setup')
        .description('Run interactive wizard to configure credentials and default package name')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console setup
`
        )
).action(async () => {
    await runInteractiveSetup();
});

withGlobalOptions(
    program
        .command('doctor')
        .description('Run diagnostic checks on configuration, key file, and API scopes')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console doctor
  $ play-console doctor -k /path/to/key.json -p com.example.app
`
        )
).action(async () => {
    await runDoctorCommand();
});

const configCmd = program.command('config').description('View or edit persistent configuration settings');

configCmd
    .command('show')
    .description('Display saved configuration file and settings')
    .action(() => {
        handleConfigShow();
    });

configCmd
    .command('get')
    .argument('<key>', 'Config key to fetch (keyFile | packageName)')
    .description('Get value for a config key')
    .action((key) => {
        handleConfigGet(key);
    });

configCmd
    .command('set')
    .argument('<key>', 'Config key to set (keyFile | packageName)')
    .argument('<value>', 'Value to store')
    .description('Set value for a config key')
    .action((key, value) => {
        handleConfigSet(key, value);
    });

configCmd
    .command('unset')
    .argument('<key>', 'Config key to remove')
    .description('Unset a config key')
    .action((key) => {
        handleConfigUnset(key);
    });

withGlobalOptions(
    program
        .command('mcp')
        .description('Start the Stdio MCP server for Google Play Console (Secondary mode)')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console mcp
  $ play-console mcp -k /path/to/key.json -p com.example.app
`
        )
).action(async () => {
    await runMcpServer();
});

const edit = program
    .command('edit')
    .description('Manage Play Console draft edit sessions')
    .addHelpText(
        'after',
        `
Workflow:
  1. play-console edit create -p com.example.app
  2. play-console edit upload-aab --edit-id <ID> --aab-path ./app.aab
  3. play-console edit assign-track --edit-id <ID> --track production --version-code 100
  4. play-console edit validate --edit-id <ID>
  5. play-console edit commit --edit-id <ID>
`
    );

withGlobalOptions(
    edit
        .command('create')
        .description('Create a new draft edit session')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console edit create -p com.example.app
  $ play-console edit create -k ./key.json -p com.example.app
`
        )
).action(async () => {
    await handleCreateEdit({});
});

withGlobalOptions(
    edit
        .command('upload-aab')
        .description('Upload an Android App Bundle (.aab)')
        .requiredOption('--edit-id <id>', 'Edit session ID (returned from `edit create`)')
        .requiredOption('--aab-path <path>', 'Path to .aab binary file')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console edit upload-aab --edit-id 123456789 --aab-path ./build/app-release.aab
`
        )
).action(async (options) => {
    await handleUploadAab({ editId: options.editId, aabPath: options.aabPath });
});

withGlobalOptions(
    edit
        .command('assign-track')
        .description('Assign version code to a release track')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .requiredOption('--track <name>', 'Track name (production, beta, alpha, internal)')
        .requiredOption('--version-code <codeOrNumber>', 'Version code (numeric integer)')
        .option('--user-fraction <fraction>', 'User fraction for staged rollout (e.g., 0.1 for 10%)')
        .option('--status <status>', 'Release status (completed, draft, halted, inProgress)', 'completed')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console edit assign-track --edit-id 123456789 --track production --version-code 105
  $ play-console edit assign-track --edit-id 123456789 --track beta --version-code 105 --user-fraction 0.2 --status inProgress
`
        )
).action(async (options) => {
    await handleAssignTrack({
        editId: options.editId,
        track: options.track,
        versionCode: parseInt(options.versionCode, 10),
        userFraction: options.userFraction ? parseFloat(options.userFraction) : undefined,
        status: options.status,
    });
});

withGlobalOptions(
    edit
        .command('validate')
        .description('Validate a draft edit session')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console edit validate --edit-id 123456789
`
        )
).action(async (options) => {
    await handleValidateEdit({ editId: options.editId });
});

withGlobalOptions(
    edit
        .command('commit')
        .description('Commit a draft edit session')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console edit commit --edit-id 123456789
`
        )
).action(async (options) => {
    await handleCommitEdit({ editId: options.editId });
});

const tracks = program
    .command('tracks')
    .description('Manage release tracks')
    .addHelpText(
        'after',
        `
Examples:
  $ play-console tracks list --edit-id 123456789
  $ play-console tracks get --edit-id 123456789 --track production
`
    );

withGlobalOptions(
    tracks
        .command('list')
        .description('List all release tracks in active edit session')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console tracks list --edit-id 123456789
`
        )
).action(async (options) => {
    await handleListTracks({ editId: options.editId });
});

withGlobalOptions(
    tracks
        .command('get')
        .description('Get details for a specific release track')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .requiredOption('--track <name>', 'Track name (production, beta, alpha, internal)')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console tracks get --edit-id 123456789 --track production
`
        )
).action(async (options) => {
    await handleGetTrack({ editId: options.editId, track: options.track });
});

const reviews = program
    .command('reviews')
    .description('Inspect and reply to user reviews')
    .addHelpText(
        'after',
        `
Examples:
  $ play-console reviews list -p com.example.app --max-results 10
  $ play-console reviews get --review-id gp:AOqpTOE... -p com.example.app
  $ play-console reviews reply --review-id gp:AOqpTOE... --reply-text "Thank you for your feedback!"
`
    );

withGlobalOptions(
    reviews
        .command('list')
        .description('List recent user reviews')
        .option('--max-results <number>', 'Maximum results (default: 100)')
        .option('--start-index <number>', 'Start index for pagination')
        .option('--token <token>', 'Pagination token')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console reviews list -p com.example.app
  $ play-console reviews list -p com.example.app --max-results 20
`
        )
).action(async (options) => {
    await handleListReviews({
        maxResults: options.maxResults ? parseInt(options.maxResults, 10) : undefined,
        startIndex: options.startIndex ? parseInt(options.startIndex, 10) : undefined,
        token: options.token,
    });
});

withGlobalOptions(
    reviews
        .command('get')
        .description('Get specific review by ID')
        .requiredOption('--review-id <id>', 'Review ID')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console reviews get --review-id gp:AOqpTOE... -p com.example.app
`
        )
).action(async (options) => {
    await handleGetReview({ reviewId: options.reviewId });
});

withGlobalOptions(
    reviews
        .command('reply')
        .description('Reply to a user review')
        .requiredOption('--review-id <id>', 'Review ID')
        .requiredOption('--reply-text <text>', 'Reply text (max 350 chars)')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console reviews reply --review-id gp:AOqpTOE... --reply-text "Thanks for your feedback! We fixed this in v2.0."
`
        )
).action(async (options) => {
    await handleReplyReview({ reviewId: options.reviewId, replyText: options.replyText });
});

const reporting = program
    .command('reporting')
    .description('Query Android Vitals reporting metrics')
    .addHelpText(
        'after',
        `
Examples:
  $ play-console reporting crash-rate -p com.example.app --start-date 2026-01-01 --end-date 2026-01-31
  $ play-console reporting anr-rate -p com.example.app --start-date 2026-01-01
`
    );

withGlobalOptions(
    reporting
        .command('crash-rate')
        .description('Query daily crash rate metrics')
        .option('--start-date <YYYY-MM-DD>', 'Start date (YYYY-MM-DD)')
        .option('--end-date <YYYY-MM-DD>', 'End date (YYYY-MM-DD)')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console reporting crash-rate -p com.example.app --start-date 2026-01-01 --end-date 2026-01-31
`
        )
).action(async (options) => {
    await handleQueryCrashRate({ startDate: options.startDate, endDate: options.endDate });
});

withGlobalOptions(
    reporting
        .command('anr-rate')
        .description('Query daily ANR rate metrics')
        .option('--start-date <YYYY-MM-DD>', 'Start date (YYYY-MM-DD)')
        .option('--end-date <YYYY-MM-DD>', 'End date (YYYY-MM-DD)')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console reporting anr-rate -p com.example.app --start-date 2026-01-01 --end-date 2026-01-31
`
        )
).action(async (options) => {
    await handleQueryAnrRate({ startDate: options.startDate, endDate: options.endDate });
});

const listing = program
    .command('listing')
    .description('Manage store listings')
    .addHelpText(
        'after',
        `
Examples:
  $ play-console listing get --edit-id 123456789 --language en-US
  $ play-console listing update --edit-id 123456789 --language en-US --title "My App"
  $ play-console listing list-all --edit-id 123456789
`
    );

withGlobalOptions(
    listing
        .command('get')
        .description('Get store listing for a language')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .requiredOption('--language <lang>', 'Language code (e.g., en-US)')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console listing get --edit-id 123456789 --language en-US
`
        )
).action(async (options) => {
    await handleGetStoreListing({ editId: options.editId, language: options.language });
});

withGlobalOptions(
    listing
        .command('update')
        .description('Update store listing text')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .requiredOption('--language <lang>', 'Language code (e.g., en-US)')
        .option('--title <title>', 'App title (max 50 chars)')
        .option('--short-description <desc>', 'Short description (max 80 chars)')
        .option('--full-description <desc>', 'Full description (max 4000 chars)')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console listing update --edit-id 123456789 --language en-US --title "New App Name" --short-description "Best utility app"
`
        )
).action(async (options) => {
    await handleUpdateStoreListing({
        editId: options.editId,
        language: options.language,
        title: options.title,
        shortDescription: options.shortDescription,
        fullDescription: options.fullDescription,
    });
});

withGlobalOptions(
    listing
        .command('list-all')
        .description('List all store listings for edit session')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console listing list-all --edit-id 123456789
`
        )
).action(async (options) => {
    await handleListAllListings({ editId: options.editId });
});

const images = program
    .command('images')
    .description('Manage store listing images')
    .addHelpText(
        'after',
        `
Image Types:
  icon, featureGraphic, phoneScreenshots, sevenInchScreenshots, tenInchScreenshots, tvScreenshots, wearScreenshots

Examples:
  $ play-console images list --edit-id 123456789 --image-type icon --language en-US
  $ play-console images upload --edit-id 123456789 --image-type icon --image-path ./icon.png --language en-US
`
    );

withGlobalOptions(
    images
        .command('upload')
        .description('Upload a store image asset')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .requiredOption('--image-type <type>', 'Image type (icon, featureGraphic, phoneScreenshots, etc.)')
        .requiredOption('--image-path <path>', 'Path to image file (.png or .jpg)')
        .option('--language <lang>', 'Language code', 'en-US')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console images upload --edit-id 123456789 --image-type icon --image-path ./icon.png --language en-US
  $ play-console images upload --edit-id 123456789 --image-type phoneScreenshots --image-path ./screen1.png
`
        )
).action(async (options) => {
    await handleUploadStoreImage({
        editId: options.editId,
        imageType: options.imageType,
        imagePath: options.imagePath,
        language: options.language,
    });
});

withGlobalOptions(
    images
        .command('delete')
        .description('Delete a specific store image by ID')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .requiredOption('--image-type <type>', 'Image type')
        .requiredOption('--image-id <id>', 'Image ID to delete')
        .option('--language <lang>', 'Language code', 'en-US')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console images delete --edit-id 123456789 --image-type phoneScreenshots --image-id img_12345 --language en-US
`
        )
).action(async (options) => {
    await handleDeleteStoreImage({
        editId: options.editId,
        imageType: options.imageType,
        imageId: options.imageId,
        language: options.language,
    });
});

withGlobalOptions(
    images
        .command('delete-all')
        .description('Delete all store images for a specific type')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .requiredOption('--image-type <type>', 'Image type')
        .option('--language <lang>', 'Language code', 'en-US')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console images delete-all --edit-id 123456789 --image-type phoneScreenshots --language en-US
`
        )
).action(async (options) => {
    await handleDeleteAllStoreImages({
        editId: options.editId,
        imageType: options.imageType,
        language: options.language,
    });
});

withGlobalOptions(
    images
        .command('list')
        .description('List store images for a specific type')
        .requiredOption('--edit-id <id>', 'Edit session ID')
        .requiredOption('--image-type <type>', 'Image type')
        .option('--language <lang>', 'Language code', 'en-US')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console images list --edit-id 123456789 --image-type phoneScreenshots --language en-US
`
        )
).action(async (options) => {
    await handleListStoreImages({
        editId: options.editId,
        imageType: options.imageType,
        language: options.language,
    });
});

const inapp = program
    .command('inapp')
    .description('Manage in-app products')
    .addHelpText(
        'after',
        `
Examples:
  $ play-console inapp list -p com.example.app
`
    );

withGlobalOptions(
    inapp
        .command('list')
        .description('List in-app products')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console inapp list -p com.example.app
`
        )
).action(async () => {
    await handleListInAppProducts({});
});

const subscriptions = program
    .command('subscriptions')
    .description('Manage active subscriptions')
    .addHelpText(
        'after',
        `
Examples:
  $ play-console subscriptions list -p com.example.app
`
    );

withGlobalOptions(
    subscriptions
        .command('list')
        .description('List active subscriptions catalog')
        .addHelpText(
            'after',
            `
Examples:
  $ play-console subscriptions list -p com.example.app
`
        )
).action(async () => {
    await handleListSubscriptions({});
});

const args = process.argv.slice(2);
const isMcpBinary = process.argv[1]?.endsWith('play-console-mcp');
const hasMcpFlag = args.includes('--mcp');

if (isMcpBinary || hasMcpFlag || (args.length === 0 && !process.stdin.isTTY)) {
    applyGlobalOptions(program.opts());
    runMcpServer().catch((err) => {
        console.error(`MCP Server Error: ${err.message}`);
        process.exit(1);
    });
} else {
    program.parseAsync(process.argv).catch((err) => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    });
}
