import { z } from 'zod';
import { getAuth } from '../auth.js';
import { getPackageName, wrapError, wrapJson, wrapText } from '../utils.js';

export const registerReviewTools = (server: any) => {
    server.registerTool(
        'list_reviews',
        {
            description:
                'Fetch a list of recent user reviews for the specified app. Returns ratings, comments, device details, and pagination metadata.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                maxResults: z.number().int().min(1).max(100).optional().default(10),
                startIndex: z.number().int().optional().default(0),
                token: z.string().optional().describe('Pagination token from previous call.'),
            },
        },
        async ({ packageName, maxResults, startIndex, token }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.reviews.list({
                    packageName: pkg,
                    maxResults,
                    startIndex,
                    token,
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'get_review',
        {
            description: 'Retrieve details of a single user review by its unique review ID.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                reviewId: z.string().describe('The ID of the review to fetch.'),
            },
        },
        async ({ packageName, reviewId }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.reviews.get({
                    packageName: pkg,
                    reviewId,
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'reply_review',
        {
            description:
                'Reply to a user review. If a reply already exists for the review, it will be overwritten and updated. Reply character limit is 350.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                reviewId: z.string().describe('The ID of the review to reply to.'),
                replyText: z.string().min(1).max(350).describe('The text of the reply (max 350 chars).'),
            },
        },
        async ({ packageName, reviewId, replyText }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { publisher } = await getAuth();
                const res = await publisher.reviews.reply({
                    packageName: pkg,
                    reviewId,
                    requestBody: { replyText },
                });
                const reply = (res.data as any).replyText || 'success';
                return wrapText(`Successfully replied to review ${reviewId}. Result: ${reply}`);
            } catch (e) {
                return wrapError(e);
            }
        }
    );
};
