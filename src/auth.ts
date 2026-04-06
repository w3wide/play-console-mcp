import { google } from 'googleapis';
import * as dotenv from 'dotenv';
dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/androidpublisher'];

export async function getAuthClient() {
  // This automatically uses Application Default Credentials (ADC)
  // 1. Checks GOOGLE_APPLICATION_CREDENTIALS env var
  // 2. Checks well-known location for 'gcloud auth application-default login'
  // 3. Checks Metadata server (if on Google Cloud)
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
  });
  
  const authClient = await auth.getClient();
  return google.androidpublisher({
    version: 'v3',
    auth: authClient as any,
  });
}
