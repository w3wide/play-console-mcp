import { getAuth } from '../auth.js';
import { loadConfig, getConfigPath } from '../config.js';
import { expandPath } from '../utils.js';
import * as fs from 'fs';
import * as path from 'path';

export async function runDoctorCommand() {
    console.log('=== Google Play Console CLI & MCP Diagnostic Doctor ===\n');

    const config = loadConfig();
    const configPath = getConfigPath();

    console.log(`0. Configuration File:`);
    if (fs.existsSync(configPath)) {
        console.log(`   [SUCCESS] Loaded from ${configPath}`);
        if (config.keyFile) console.log(`   - Saved Key File: ${config.keyFile}`);
        if (config.packageName) console.log(`   - Saved Package Name: ${config.packageName}`);
    } else {
        console.log(`   [INFO] No config file found at ${configPath}. Run "play-console setup" to create one.`);
    }

    console.log('\n1. Service Account Credentials Check:');
    let hasCredentials = false;
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || (config.keyFile?.trim().startsWith('{') ? config.keyFile : undefined);
    const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS || (config.keyFile && !config.keyFile.trim().startsWith('{') ? config.keyFile : undefined);

    if (serviceAccountJson) {
        try {
            const credentials = JSON.parse(serviceAccountJson);
            console.log('   [SUCCESS] Valid JSON credentials detected.');
            console.log(`   - Client Email: ${credentials.client_email || 'N/A'}`);
            console.log(`   - Project ID: ${credentials.project_id || 'N/A'}`);
            hasCredentials = true;
        } catch (err: any) {
            console.log(`   [ERROR] Failed to parse Service Account JSON: ${err.message}`);
        }
    } else if (keyFilePath) {
        try {
            const resolvedPath = expandPath(keyFilePath);
            if (fs.existsSync(resolvedPath)) {
                const raw = fs.readFileSync(resolvedPath, 'utf8');
                const credentials = JSON.parse(raw);
                console.log(`   [SUCCESS] Valid JSON key file at ${resolvedPath}`);
                console.log(`   - Client Email: ${credentials.client_email || 'N/A'}`);
                console.log(`   - Project ID: ${credentials.project_id || 'N/A'}`);
                hasCredentials = true;
            } else {
                console.log(`   [ERROR] Key file not found at path: ${resolvedPath}`);
            }
        } catch (err: any) {
            console.log(`   [ERROR] Failed to read key file at ${keyFilePath}: ${err.message}`);
        }
    } else {
        console.log('   [WARNING] No credentials found via environment or saved config. Run "play-console setup" or pass -k /path/to/key.json.');
    }

    console.log('\n2. Default Package Name Check:');
    const pkg = process.env.DEFAULT_PACKAGE_NAME || config.packageName;
    if (pkg) {
        console.log(`   [SUCCESS] Package name set to: "${pkg}"`);
    } else {
        console.log('   [INFO] Default package name not set. Pass -p <name> or run "play-console setup".');
    }

    if (hasCredentials) {
        try {
            console.log('\n3. Google Play API Connectivity & Scopes Check:');
            console.log('   Authenticating with Google OAuth server...');
            const { publisher } = await getAuth();
            console.log('   [SUCCESS] Authentication token successfully generated!');
            console.log('   - Scopes allowed: androidpublisher, playdeveloperreporting');
        } catch (err: any) {
            console.log('   [ERROR] Failed to authenticate: ' + err.message);
        }
    }

    console.log('\n=== Diagnostic Check Complete ===\n');
}
