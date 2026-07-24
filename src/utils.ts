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
export const wrapError = (e: any) => ({
    isError: true,
    content: [{ type: 'text', text: e.message || String(e) }],
});

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
