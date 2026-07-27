import { z } from 'zod';

export const registerPrompts = (server: any) => {
    server.registerPrompt(
        'app_health_audit',
        {
            description:
                'Audit Android Vitals metrics (crash rates and ANR rates) for an app and generate an actionable health summary report.',
            argsSchema: z.object({
                packageName: z
                    .string()
                    .optional()
                    .describe('App package name (e.g. com.example.app). Defaults to environment setting if omitted.'),
            }),
        },
        async ({ packageName }: any) => {
            const pkgInfo = packageName ? `for app "${packageName}"` : 'for the default configured app';
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Please perform a comprehensive Android Vitals stability audit ${pkgInfo}.\n\nFollow these steps:\n1. Use the 'query_crash_rate' tool to retrieve daily crash percentage metrics.\n2. Use the 'query_anr_rate' tool to retrieve daily ANR percentage metrics.\n3. Analyze whether the metrics exceed Google Play threshold limits (Crash rate > 1.09%, ANR rate > 0.47%).\n4. Provide a structured summary report with risk assessment and recommended developer actions.`,
                        },
                    },
                ],
            };
        }
    );

    server.registerPrompt(
        'release_preparation',
        {
            description:
                'Interactive step-by-step workflow guide to prepare, stage, validate, and commit a new app release build.',
            argsSchema: z.object({
                packageName: z
                    .string()
                    .optional()
                    .describe('App package name (e.g. com.example.app). Defaults to environment setting if omitted.'),
                track: z
                    .string()
                    .optional()
                    .default('internal')
                    .describe('Target release track (internal, alpha, beta, production). Default is "internal".'),
            }),
        },
        async ({ packageName, track }: any) => {
            const pkgInfo = packageName ? `for package "${packageName}"` : '';
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Help me prepare and submit a new app release to the "${track}" track ${pkgInfo}.\n\nGuide me through the release process:\n1. Initialize a new edit transaction session using 'create_edit'.\n2. Check active tracks and existing release version codes using 'list_tracks'.\n3. Ask me for the local path to the new AAB binary file to upload using 'upload_aab'.\n4. Assign the uploaded version code to the "${track}" track using 'assign_track'.\n5. Validate the edit session using 'validate_edit' before committing.\n6. Finally, commit the edit using 'commit_edit' after my confirmation.`,
                        },
                    },
                ],
            };
        }
    );

    server.registerPrompt(
        'review_response_assistant',
        {
            description:
                'Fetch recent user reviews, filter negative or unanswered reviews, and draft professional, helpful response templates (max 350 chars).',
            argsSchema: z.object({
                packageName: z
                    .string()
                    .optional()
                    .describe('App package name (e.g. com.example.app). Defaults to environment setting if omitted.'),
                maxResults: z.number().int().optional().default(10).describe('Maximum number of reviews to inspect.'),
            }),
        },
        async ({ packageName, maxResults }: any) => {
            const pkgInfo = packageName ? `for package "${packageName}"` : '';
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Help me review and respond to user feedback ${pkgInfo}.\n\nSteps:\n1. Fetch the latest ${maxResults} user reviews using the 'list_reviews' tool.\n2. Identify reviews that have rating <= 3 stars or do not have a developer reply yet.\n3. For each identified review, draft a polite, helpful, and empathetic reply (strictly under 350 characters limit).\n4. Present the drafted replies to me for confirmation before submitting them via 'reply_review'.`,
                        },
                    },
                ],
            };
        }
    );

    server.registerPrompt(
        'store_listing_optimizer',
        {
            description:
                'Inspect localized Play Store listing texts and suggest ASO-optimized titles, short descriptions, and full descriptions.',
            argsSchema: z.object({
                packageName: z
                    .string()
                    .optional()
                    .describe('App package name (e.g. com.example.app). Defaults to environment setting if omitted.'),
                language: z
                    .string()
                    .optional()
                    .default('en-US')
                    .describe('Target language code (e.g. en-US, es-ES). Default is "en-US".'),
            }),
        },
        async ({ packageName, language }: any) => {
            const pkgInfo = packageName ? `for package "${packageName}"` : '';
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Help me optimize the Google Play Store listing ${pkgInfo} for language "${language}".\n\nSteps:\n1. Create a draft edit session using 'create_edit'.\n2. Retrieve current store listing metadata using 'get_store_listing' for language "${language}".\n3. Analyze the current title (max 50 chars), short description (max 80 chars), and full description (max 4000 chars).\n4. Propose App Store Optimization (ASO) improvements with targeted keywords and improved readability.\n5. Ask for my confirmation to update the listing using 'update_store_listing' and commit using 'commit_edit'.`,
                        },
                    },
                ],
            };
        }
    );
};
