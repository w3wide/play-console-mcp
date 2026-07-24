import { z } from 'zod';
import { getAuth } from '../auth.js';
import { getPackageName, wrapError, wrapJson, wrapText } from '../utils.js';
import * as fs from 'fs';

export const registerPublishingTools = (server: any) => {
    server.registerTool(
        'create_edit',
        {
            description:
                'Initialize a new draft edit transaction session for app updates or publishing. The returned edit ID is required for all other publishing, listing, and track operations. Edits expire after 48 hours.',
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
                const res = await publisher.edits.insert({ packageName: pkg });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'upload_aab',
        {
            description:
                'Upload an Android App Bundle (AAB) binary to an active edit session. The target file path is validated before uploading.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                editId: z.string().describe('Active edit ID (from create_edit).'),
                aabPath: z.string().describe('Absolute path to the .aab file.'),
            },
        },
        async ({ packageName, editId, aabPath }: any) => {
            try {
                if (!fs.existsSync(aabPath)) {
                    throw new Error(`Android App Bundle file not found at path: ${aabPath}`);
                }
                const stat = fs.statSync(aabPath);
                if (!stat.isFile()) {
                    throw new Error(`Path is not a file: ${aabPath}`);
                }
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.edits.bundles.upload({
                    packageName: pkg,
                    editId,
                    media: {
                        mimeType: 'application/octet-stream',
                        body: fs.createReadStream(aabPath),
                    },
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'assign_track',
        {
            description:
                'Assign an uploaded version code to a release track (such as production, beta, alpha, or internal) within the active edit session.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                editId: z.string().describe('Active edit ID.'),
                track: z.string().describe('Track name (e.g., production, beta).'),
                versionCode: z.number().int().describe('The version code of the uploaded APK/AAB.'),
                status: z.enum(['completed', 'draft', 'halted', 'inProgress']).optional().default('completed'),
                userFraction: z
                    .number()
                    .min(0)
                    .max(1)
                    .optional()
                    .describe('Fraction of users who will receive the release (for staged rollouts).'),
            },
        },
        async ({ packageName, editId, track, versionCode, status, userFraction }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.edits.tracks.update({
                    packageName: pkg,
                    editId,
                    track,
                    requestBody: {
                        releases: [
                            {
                                versionCodes: [versionCode.toString()],
                                status,
                                userFraction: status === 'inProgress' ? userFraction : undefined,
                            },
                        ],
                    },
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'commit_edit',
        {
            description:
                'Commit all changes staged in the active edit session to make them live or submit them for store review.',
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
                const res = await publisher.edits.commit({ packageName: pkg, editId });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'get_track',
        {
            description:
                'Retrieve release track details (releases, rollout percentages, version codes) for a specific track (e.g. production, beta, alpha, internal) in the active edit session.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                editId: z.string().describe('Active edit ID.'),
                track: z.string().describe('Track name (e.g., production, beta, alpha, internal).'),
            },
        },
        async ({ packageName, editId, track }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.edits.tracks.get({ packageName: pkg, editId, track });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'list_tracks',
        {
            description:
                'List all release tracks and their active/draft releases configured in the active edit session.',
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
                const res = await publisher.edits.tracks.list({ packageName: pkg, editId });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );
};
