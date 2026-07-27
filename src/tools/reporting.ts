import { z } from 'zod';
import { getAuth } from '../auth.js';
import { getPackageName, wrapError, wrapJson } from '../utils.js';

export const registerReportingTools = (server: any) => {
    server.registerTool(
        'query_crash_rate',
        {
            description:
                'Query application crash rate statistics. Returns daily crash percentage metrics (ratio of daily active users who experienced a crash) for the stability vital check.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                pageSize: z.number().int().optional().default(10),
                pageToken: z.string().optional(),
                filter: z.string().optional().describe('Optional filter expression (AIP-160) e.g. versionCode = 100.'),
                metrics: z
                    .array(z.string())
                    .optional()
                    .describe('Optional list of metrics to fetch (e.g., ["crashRate", "userPerceivedCrashRate"]).'),
            },
        },
        async ({ packageName, pageSize, pageToken, filter, metrics }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { reporting } = await getAuth();
                const resourceName = `apps/${pkg}/crashRateMetricSet`;
                const res = await reporting.vitals.crashrate.query({
                    name: resourceName,
                    requestBody: {
                        timelineSpec: {
                            aggregationPeriod: 'DAILY',
                        },
                        pageSize,
                        pageToken,
                        filter,
                        metrics,
                    },
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );

    server.registerTool(
        'query_anr_rate',
        {
            description:
                'Query application ANR (App Not Responding) rate statistics. Returns daily ANR percentage metrics (ratio of daily active users who experienced an ANR) for app health check.',
            inputSchema: {
                packageName: z
                    .string()
                    .optional()
                    .describe(
                        'App package name (e.g. com.example.app). Falls back to the default package name configured via CLI/environment if omitted.'
                    ),
                pageSize: z.number().int().optional().default(10),
                pageToken: z.string().optional(),
                filter: z.string().optional().describe('Optional filter expression (AIP-160) e.g. versionCode = 100.'),
                metrics: z
                    .array(z.string())
                    .optional()
                    .describe('Optional list of metrics to fetch (e.g., ["anrRate", "userPerceivedAnrRate"]).'),
            },
        },
        async ({ packageName, pageSize, pageToken, filter, metrics }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { reporting } = await getAuth();
                const resourceName = `apps/${pkg}/anrRateMetricSet`;
                const res = await reporting.vitals.anrrate.query({
                    name: resourceName,
                    requestBody: {
                        timelineSpec: {
                            aggregationPeriod: 'DAILY',
                        },
                        pageSize,
                        pageToken,
                        filter,
                        metrics,
                    },
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );
};
