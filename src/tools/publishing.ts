import { z } from 'zod';
import { getAuth } from '../auth.js';
import { getPackageName, wrapError, wrapJson, wrapText } from '../utils.js';
import * as fs from 'fs';

export const registerPublishingTools = (server: any) => {
    server.registerTool(
        'create_edit',
        {
            description: 'Start a new edit for app publishing/store listing updates. Edits expire after 48 hours.',
            inputSchema: {
                packageName: z.string().optional().describe('App package name.'),
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
            description: 'Upload an Android App Bundle (AAB) to an active edit.',
            inputSchema: {
                packageName: z.string().optional().describe('App package name.'),
                editId: z.string().describe('Active edit ID (from create_edit).'),
                aabPath: z.string().describe('Absolute path to the .aab file.'),
            },
        },
        async ({ packageName, editId, aabPath }: any) => {
            try {
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
            description: 'Assign an uploaded bundle/apk to a track (production, beta, alpha, internal).',
            inputSchema: {
                packageName: z.string().optional().describe('App package name.'),
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
                'Commit an active edit to save and apply all changes. This is when changes go live or to review.',
            inputSchema: {
                packageName: z.string().optional().describe('App package name.'),
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
};
