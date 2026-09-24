import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
    'https://www.googleapis.com/auth/androidpublisher',
    'https://www.googleapis.com/auth/playdeveloperreporting',
];

import { getConfigValue } from './config.js';
import { expandPath } from './utils.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Gets a Google Auth client based on environment variables or persistent config.
 */
export async function getAuth() {
    let serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const savedKeyFile = getConfigValue('keyFile');
        if (savedKeyFile) {
            if (savedKeyFile.trim().startsWith('{')) {
                serviceAccountJson = savedKeyFile;
            } else {
                try {
                    const resolved = expandPath(savedKeyFile);
                    if (fs.existsSync(resolved)) {
                        serviceAccountJson = fs.readFileSync(resolved, 'utf8');
                    }
                } catch {
                    // Ignore read errors, will fall back to default GoogleAuth
                }
            }
        }
    }

    let auth: any;

    if (serviceAccountJson) {
        const credentials = JSON.parse(serviceAccountJson);
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });
    } else {
        auth = new google.auth.GoogleAuth({
            scopes: SCOPES,
        });
    }

    const authClient = await auth.getClient();
    return {
        publisher: google.androidpublisher({ version: 'v3', auth: authClient as any }),
        reporting: google.playdeveloperreporting({ version: 'v1alpha1', auth: authClient as any }),
        authClient,
    };
}
