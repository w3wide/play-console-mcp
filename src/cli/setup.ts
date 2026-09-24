import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, saveConfig, getConfigPath } from '../config.js';
import { runDoctorCommand } from './doctor.js';

export async function runInteractiveSetup() {
    console.log('=== Interactive Play Console CLI Setup Wizard ===\n');

    const config = loadConfig();
    const configPath = getConfigPath();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const ask = (query: string): Promise<string> =>
        new Promise((resolve) => rl.question(query, resolve));

    try {
        console.log(`Config file path: ${configPath}\n`);

        const currentKey = config.keyFile || process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
        const keyInput = await ask(
            `1. Enter path to Service Account JSON Key File${currentKey ? ` [Default: ${currentKey}]` : ''}: `
        );
        const selectedKey = keyInput.trim() || currentKey;

        if (selectedKey) {
            if (!selectedKey.startsWith('{')) {
                const resolved = path.resolve(selectedKey);
                if (!fs.existsSync(resolved)) {
                    console.log(`   [WARNING] Key file does not exist at ${resolved}. Saving anyway.`);
                } else {
                    console.log(`   [SUCCESS] Validated file location: ${resolved}`);
                }
            }
            config.keyFile = selectedKey;
        }

        const currentPkg = config.packageName || process.env.DEFAULT_PACKAGE_NAME || '';
        const pkgInput = await ask(
            `\n2. Enter Default Package Name (e.g. com.example.app)${currentPkg ? ` [Default: ${currentPkg}]` : ''}: `
        );
        const selectedPkg = pkgInput.trim() || currentPkg;

        if (selectedPkg) {
            config.packageName = selectedPkg;
            console.log(`   [SUCCESS] Package name set to: ${selectedPkg}`);
        }

        saveConfig(config);
        console.log(`\n[SUCCESS] Configuration saved to ${configPath}\n`);
    } finally {
        rl.close();
    }

    // Automatically run diagnostic health check after interactive setup
    await runDoctorCommand();
}
