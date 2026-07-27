import { z } from 'zod';
import { getAuth } from '../auth.js';
import { getPackageName, wrapError, wrapJson } from '../utils.js';

const dateSchema = z
    .object({
        year: z.number().int().describe('Year (e.g. 2026)'),
        month: z.number().int().min(1).max(12).describe('Month (1-12)'),
        day: z.number().int().min(1).max(31).describe('Day of month (1-31)'),
    })
    .optional();

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
                startTime: dateSchema.describe(
                    'Optional start date for query range (e.g. { year: 2026, month: 7, day: 1 }).'
                ),
                endTime: dateSchema.describe(
                    'Optional end date for query range (e.g. { year: 2026, month: 7, day: 28 }).'
                ),
            },
        },
        async ({ packageName, pageSize, pageToken, filter, metrics, startTime, endTime }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { reporting } = await getAuth();
                const resourceName = `apps/${pkg}/crashRateMetricSet`;

                const timelineSpec: any = {
                    aggregationPeriod: 'DAILY',
                };
                if (startTime) {
                    timelineSpec.startTime = { year: startTime.year, month: startTime.month, day: startTime.day };
                }
                if (endTime) {
                    timelineSpec.endTime = { year: endTime.year, month: endTime.month, day: endTime.day };
                }

                const res = await reporting.vitals.crashrate.query({
                    name: resourceName,
                    requestBody: {
                        timelineSpec,
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
                startTime: dateSchema.describe(
                    'Optional start date for query range (e.g. { year: 2026, month: 7, day: 1 }).'
                ),
                endTime: dateSchema.describe(
                    'Optional end date for query range (e.g. { year: 2026, month: 7, day: 28 }).'
                ),
            },
        },
        async ({ packageName, pageSize, pageToken, filter, metrics, startTime, endTime }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { reporting } = await getAuth();
                const resourceName = `apps/${pkg}/anrRateMetricSet`;

                const timelineSpec: any = {
                    aggregationPeriod: 'DAILY',
                };
                if (startTime) {
                    timelineSpec.startTime = { year: startTime.year, month: startTime.month, day: startTime.day };
                }
                if (endTime) {
                    timelineSpec.endTime = { year: endTime.year, month: endTime.month, day: endTime.day };
                }

                const res = await reporting.vitals.anrrate.query({
                    name: resourceName,
                    requestBody: {
                        timelineSpec,
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
