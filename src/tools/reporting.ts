import { z } from 'zod';
import { getAuth } from '../auth.js';
import { getPackageName, wrapError, wrapJson } from '../utils.js';

export const registerReportingTools = (server: any) => {
    server.registerTool(
        'query_crash_rate',
        {
            description: 'Query crash rate metric set. Stability vital: % of daily active users with a crash.',
            inputSchema: {
                packageName: z.string().optional().describe('App package name.'),
                pageSize: z.number().int().optional().default(10),
                pageToken: z.string().optional(),
            },
        },
        async ({ packageName, pageSize, pageToken }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { reporting } = await getAuth();
                const resourceName = `apps/${pkg}/crashRateMetricSet`;
                const res = await (reporting.vitals.crashrate as any).query({
                    name: resourceName,
                    requestBody: {
                        pageSize,
                        pageToken,
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
            description: 'Query ANR (App Not Responding) rate metric set.',
            inputSchema: {
                packageName: z.string().optional().describe('App package name.'),
                pageSize: z.number().int().optional().default(10),
                pageToken: z.string().optional(),
            },
        },
        async ({ packageName, pageSize, pageToken }: any) => {
            try {
                const pkg = getPackageName(packageName);
                const { reporting } = await getAuth();
                const resourceName = `apps/${pkg}/anrRateMetricSet`;
                const res = await (reporting.vitals.anrrate as any).query({
                    name: resourceName,
                    requestBody: {
                        pageSize,
                        pageToken,
                    },
                });
                return wrapJson(res.data);
            } catch (e) {
                return wrapError(e);
            }
        }
    );
};
