import * as dotenv from 'dotenv';
dotenv.config();

/**
 * Gets the package name from user input or environment variable.
 */
export const getPackageName = (pkgName?: string) => {
    const finalPkg = pkgName || process.env.DEFAULT_PACKAGE_NAME;
    if (!finalPkg) {
        throw new Error('Package name is required. Set it in DEFAULT_PACKAGE_NAME or pass it as an argument.');
    }
    return finalPkg;
};

/**
 * Common response wrapper for errors.
 */
export const wrapError = (e: any) => {
    const message = e.message || String(e);
    const code = e.code || (e.response && e.response.status);
    const status = e.status || (e.response && e.response.data && e.response.data.error && e.response.data.error.status);

    let tip = '';

    if (
        code === 403 ||
        String(message).toLowerCase().includes('permission') ||
        String(status).toLowerCase().includes('permission')
    ) {
        if (String(message).includes('insufficient authentication scopes')) {
            tip =
                '\n\n💡 Tip: The API request had insufficient authentication scopes. Make sure you are using a Service Account JSON key instead of personal gcloud credentials, and verify the correct scopes are enabled.';
        } else {
            tip =
                '\n\n💡 Tip: Access denied (403). Please verify that the Google Play Service Account email has been added in your Google Play Console under "Users and permissions" with the required app and release permissions.';
        }
    } else if (
        code === 404 ||
        String(message).toLowerCase().includes('not found') ||
        String(status).toLowerCase().includes('not_found')
    ) {
        tip =
            '\n\n💡 Tip: Resource not found (404). Double-check the "packageName" and confirm that the Service Account has access to this specific app in the Google Play Console.';
    } else if (
        code === 429 ||
        String(message).toLowerCase().includes('quota') ||
        String(message).toLowerCase().includes('rate limit')
    ) {
        tip =
            '\n\n💡 Tip: Quota or rate limit exceeded (429). Please wait before retrying or request a quota increase in your Google Cloud Developer Console.';
    } else if (code === 400) {
        tip =
            '\n\n💡 Tip: Bad request (400). Please check your parameters (e.g. track name, version codes, or edit IDs) and try again.';
    }

    return {
        isError: true,
        content: [{ type: 'text', text: `${message}${tip}` }],
    };
};

/**
 * Common response wrapper for success JSON.
 */
export const wrapJson = (data: any) => ({
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
});

/**
 * Common response wrapper for success text.
 */
export const wrapText = (text: string) => ({
    content: [{ type: 'text', text }],
});
