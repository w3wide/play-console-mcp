import { z } from 'zod';
import { getAuth } from '../auth.js';
import { getPackageName, wrapError, wrapJson } from '../utils.js';
import * as fs from 'fs';

export const registerListingTools = (server: any) => {
    server.registerTool(
        'get_store_listing',
        {
            description:
                'Retrieve localized store listing metadata (title, short description, and full description) for a specific language code within the active edit session.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                editId: z.string().describe('Active edit ID.'),
                language: z.string().describe('Language code (e.g., en-US, es-ES).'),
            },
        },
        async ({ packageName, editId, language }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.edits.listings.get({
                    packageName: pkg,
                    editId,
                    language,
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'update_store_listing',
        {
            description:
                'Update localized store listing texts (title, short description, and full description) for a specific language code within the active edit session.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                editId: z.string().describe('Active edit ID.'),
                language: z.string().describe('Language code.'),
                title: z.string().max(50).optional().describe('App title (max 50 chars).'),
                shortDescription: z.string().max(80).optional().describe('App short description (max 80 chars).'),
                fullDescription: z.string().max(4000).optional().describe('App full description (max 4000 chars).'),
            },
        },
        async ({ packageName, editId, language, title, shortDescription, fullDescription }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.edits.listings.update({
                    packageName: pkg,
                    editId,
                    language,
                    requestBody: {
                        title,
                        shortDescription,
                        fullDescription,
                    },
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'update_data_safety',
        {
            description:
                "Upload and update the app's Data Safety declaration using raw CSV content. (Advanced usage only).",
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                safetyLabelsCsv: z.string().describe('The Data Safety CSV content.'),
            },
        },
        async ({ packageName, safetyLabelsCsv }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                // Note: the original code had a cast to any for applications.dataSafety
                // We'll try to use the correct v3 path if possible.
                // In v3 it might be publisher.applications.dataSafety
                await (publisher as any).applications.dataSafety({
                    packageName: pkg,
                    requestBody: {
                        safetyLabels: safetyLabelsCsv,
                    },
                });
                return wrapJson({ status: 'success', message: 'Successfully updated Data Safety declaration.' });
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'upload_store_image',
        {
            description:
                'Upload a new store listing asset (e.g. app icon, feature graphic, screenshots) to an active edit session. The target file path is validated before uploading.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                editId: z.string().describe('Active edit ID.'),
                language: z.string().describe('Language code (e.g. en-US).'),
                imageType: z
                    .enum([
                        'icon',
                        'featureGraphic',
                        'promoGraphic',
                        'phoneScreenshots',
                        'sevenInchScreenshots',
                        'tenInchScreenshots',
                        'tvScreenshots',
                        'wearScreenshots',
                        'tvBanner',
                    ])
                    .describe('Type of the image asset.'),
                imagePath: z.string().describe('Absolute path to the local image file (PNG/JPG).'),
            },
        },
        async ({ packageName, editId, language, imageType, imagePath }: any) => {
            try {
                if (!fs.existsSync(imagePath)) {
                    throw new Error(`Image file not found at path: ${imagePath}`);
                }
                const stat = fs.statSync(imagePath);
                if (!stat.isFile()) {
                    throw new Error(`Path is not a file: ${imagePath}`);
                }
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.edits.images.upload({
                    packageName: pkg,
                    editId,
                    language,
                    imageType,
                    media: {
                        mimeType: imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg',
                        body: fs.createReadStream(imagePath),
                    },
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'delete_store_image',
        {
            description: 'Delete a specific store listing image asset from the active edit session by its image ID.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                editId: z.string().describe('Active edit ID.'),
                language: z.string().describe('Language code.'),
                imageType: z
                    .enum([
                        'icon',
                        'featureGraphic',
                        'promoGraphic',
                        'phoneScreenshots',
                        'sevenInchScreenshots',
                        'tenInchScreenshots',
                        'tvScreenshots',
                        'wearScreenshots',
                        'tvBanner',
                    ])
                    .describe('Type of the image asset.'),
                imageId: z.string().describe('The unique ID of the image to delete.'),
            },
        },
        async ({ packageName, editId, language, imageType, imageId }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                await publisher.edits.images.delete({
                    packageName: pkg,
                    editId,
                    language,
                    imageType,
                    imageId,
                });
                return wrapJson({ status: 'success', message: `Image ${imageId} successfully deleted.` });
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'delete_all_store_images',
        {
            description:
                'Delete all store listing image assets of a specific type (e.g. all phone screenshots) from the active edit session.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                editId: z.string().describe('Active edit ID.'),
                language: z.string().describe('Language code.'),
                imageType: z
                    .enum([
                        'icon',
                        'featureGraphic',
                        'promoGraphic',
                        'phoneScreenshots',
                        'sevenInchScreenshots',
                        'tenInchScreenshots',
                        'tvScreenshots',
                        'wearScreenshots',
                        'tvBanner',
                    ])
                    .describe('Type of the image assets to delete.'),
            },
        },
        async ({ packageName, editId, language, imageType }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.edits.images.deleteall({
                    packageName: pkg,
                    editId,
                    language,
                    imageType,
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'list_store_images',
        {
            description:
                'List all uploaded store listing image assets of a specific type for a language in the active edit session.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                editId: z.string().describe('Active edit ID.'),
                language: z.string().describe('Language code.'),
                imageType: z
                    .enum([
                        'icon',
                        'featureGraphic',
                        'promoGraphic',
                        'phoneScreenshots',
                        'sevenInchScreenshots',
                        'tenInchScreenshots',
                        'tvScreenshots',
                        'wearScreenshots',
                        'tvBanner',
                    ])
                    .describe('Type of the image assets to list.'),
            },
        },
        async ({ packageName, editId, language, imageType }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.edits.images.list({
                    packageName: pkg,
                    editId,
                    language,
                    imageType,
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'list_all_listings',
        {
            description:
                'List store listing metadata for all configured languages in the active edit session. Useful for auditing all localized titles and descriptions at once.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                editId: z.string().describe('Active edit ID.'),
            },
        },
        async ({ packageName, editId }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.edits.listings.list({ packageName: pkg, editId });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );
};

export const registerMonetizationTools = (server: any) => {
    server.registerTool(
        'list_inapp_products',
        {
            description: 'List all managed in-app products (one-time purchases) catalog definitions for the app.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
            },
        },
        async ({ packageName }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await (publisher as any).monetization.onetimeproducts.list({ packageName: pkg });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'list_subscriptions',
        {
            description: 'List all active and draft in-app subscription catalog definitions configured for the app.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
            },
        },
        async ({ packageName }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                // Using publisher.monetization.subscriptions for v3
                const res = await (publisher as any).monetization.subscriptions.list({ packageName: pkg });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );
};
