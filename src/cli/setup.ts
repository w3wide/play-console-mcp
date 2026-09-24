import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, saveConfig, getConfigPath } from '../config.js';
import { expandPath } from '../utils.js';
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

        let selectedKey = '';
        const currentKey = config.keyFile || process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

        while (true) {
            const keyInput = await ask(
                `1. Enter path to Service Account JSON Key File${currentKey ? ` [Default: ${currentKey}]` : ''}: `
            );
            const inputStr = keyInput.trim() || currentKey;

            if (!inputStr) {
                break; // User skipped setting keyFile
            }

            if (inputStr.startsWith('{')) {
                selectedKey = inputStr;
                console.log(`   [SUCCESS] Validated raw JSON credentials input.`);
                break;
            }

            const expanded = expandPath(inputStr);
            if (fs.existsSync(expanded) && fs.statSync(expanded).isFile()) {
                selectedKey = expanded;
                console.log(`   [SUCCESS] Validated key file at ${expanded}`);
                break;
            } else {
                console.log(`   [ERROR] Key file not found at path: ${expanded}`);
                console.log(`   Please verify the path and try again.\n`);
            }
        }

        if (selectedKey) {
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
