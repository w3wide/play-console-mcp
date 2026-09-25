import * as readline from 'readline';
import * as fs from 'fs';
import { getAuth } from '../auth.js';
import { getPackageName, expandPath } from '../utils.js';

export interface WizardOptions {
    packageName?: string;
}

export async function runReleaseWizard(options: WizardOptions = {}) {
    console.log('=== Google Play Console Interactive Release Wizard ===\n');

    let pkg = '';
    try {
        pkg = getPackageName(options.packageName);
    } catch {
        // Will prompt below
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const ask = (query: string): Promise<string> =>
        new Promise((resolve) => rl.question(query, resolve));

    try {
        if (!pkg) {
            const pkgInput = await ask('1. Enter Package Name (e.g. com.example.app): ');
            pkg = pkgInput.trim();
            if (!pkg) {
                console.error('[ERROR] Package name is required to run the release wizard.');
                return;
            }
        } else {
            console.log(`Using Package Name: ${pkg}\n`);
        }

        const { publisher } = await getAuth();

        // Step 1: Create Draft Edit Session
        console.log('Step 1/5: Initializing new draft edit session...');
        const editRes = await publisher.edits.insert({ packageName: pkg });
        const editId = editRes.data.id;
        if (!editId) {
            throw new Error('Failed to create draft edit session.');
        }
        console.log(`[SUCCESS] Edit Session Created! ID: ${editId}\n`);

        // Step 2: Prompt for AAB File & Upload
        let aabPath = '';
        while (true) {
            const input = await ask('Step 2/5: Enter path to Android App Bundle (.aab) file: ');
            const expanded = expandPath(input.trim());
            if (fs.existsSync(expanded) && fs.statSync(expanded).isFile()) {
                aabPath = expanded;
                break;
            }
            console.log(`[ERROR] File not found at path: ${expanded}. Please try again.\n`);
        }

        console.log(`Uploading ${aabPath} to edit session ${editId}...`);
        const bundleRes = await publisher.edits.bundles.upload({
            packageName: pkg,
            editId,
            media: {
                mimeType: 'application/octet-stream',
                body: fs.createReadStream(aabPath),
            },
        });
        const versionCode = bundleRes.data.versionCode;
        console.log(`[SUCCESS] AAB Uploaded! Version Code: ${versionCode}\n`);

        // Step 3: Select Release Track & Assign
        console.log('Step 3/5: Select Release Track');
        console.log('  1. production (Default)');
        console.log('  2. beta');
        console.log('  3. alpha');
        console.log('  4. internal');
        const trackChoice = await ask('Select track number or type track name [Default: production]: ');
        let selectedTrack = 'production';
        const trimmedChoice = trackChoice.trim().toLowerCase();
        if (trimmedChoice === '2' || trimmedChoice === 'beta') selectedTrack = 'beta';
        else if (trimmedChoice === '3' || trimmedChoice === 'alpha') selectedTrack = 'alpha';
        else if (trimmedChoice === '4' || trimmedChoice === 'internal') selectedTrack = 'internal';

        console.log(`Assigning Version Code ${versionCode} to track "${selectedTrack}"...`);
        await publisher.edits.tracks.update({
            packageName: pkg,
            editId,
            track: selectedTrack,
            requestBody: {
                track: selectedTrack,
                releases: [
                    {
                        versionCodes: [versionCode!.toString()],
                        status: 'completed',
                    },
                ],
            },
        });
        console.log(`[SUCCESS] Assigned to track "${selectedTrack}"!\n`);

        // Step 4: Validate Edit Session
        console.log('Step 4/5: Validating staged edit session...');
        await publisher.edits.validate({ packageName: pkg, editId });
        console.log('[SUCCESS] Staged edit session validated with zero errors!\n');

        // Step 5: Confirm & Commit
        const commitAnswer = await ask('Step 5/5: Do you want to COMMIT and publish this release live? (y/N): ');
        if (commitAnswer.trim().toLowerCase() === 'y' || commitAnswer.trim().toLowerCase() === 'yes') {
            console.log(`Committing edit session ${editId}...`);
            await publisher.edits.commit({ packageName: pkg, editId });
            console.log('\n🎉 [SUCCESS] Release committed and published successfully!\n');
        } else {
            console.log(`\n[INFO] Edit session ${editId} saved as draft (uncommitted).\n`);
        }
    } catch (err: any) {
        console.error(`\n[ERROR] Wizard failed: ${err.message}\n`);
    } finally {
        rl.close();
    }
}
