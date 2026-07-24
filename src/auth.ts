import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
    'https://www.googleapis.com/auth/androidpublisher',
    'https://www.googleapis.com/auth/playdeveloperreporting',
];

/**
 * Gets a Google Auth client based on environment variables.
 */
export async function getAuth() {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

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
        reporting: google.playdeveloperreporting({ version: 'v1beta1', auth: authClient as any }),
        authClient,
    };
}
