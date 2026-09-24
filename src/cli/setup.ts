import * as fs from 'fs';
import { getAuth } from '../auth.js';

export async function runSetupCommand(): Promise<void> {
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
}
