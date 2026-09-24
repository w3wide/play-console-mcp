import { getAuth } from '../auth.js';
import { getPackageName, wrapError } from '../utils.js';

export interface HandleQueryCrashRateOptions {
    packageName?: string;
    startDate?: string;
    endDate?: string;
}

function parseDateString(dateStr?: string) {
    if (!dateStr) return undefined;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return undefined;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
    return { year, month, day };
}

export async function handleQueryCrashRate({
    packageName,
    startDate,
    endDate,
}: HandleQueryCrashRateOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { reporting } = await getAuth();
        const resourceName = `apps/${pkg}/crashRateMetricSet`;

        const timelineSpec: any = {
            aggregationPeriod: 'DAILY',
        };
        const startTime = parseDateString(startDate);
        const endTime = parseDateString(endDate);
        if (startTime) {
            timelineSpec.startTime = startTime;
        }
        if (endTime) {
            timelineSpec.endTime = endTime;
        }

        const res = await reporting.vitals.crashrate.query({
            name: resourceName,
            requestBody: {
                timelineSpec,
            },
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleQueryAnrRateOptions {
    packageName?: string;
    startDate?: string;
    endDate?: string;
}

export async function handleQueryAnrRate({
    packageName,
    startDate,
    endDate,
}: HandleQueryAnrRateOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { reporting } = await getAuth();
        const resourceName = `apps/${pkg}/anrRateMetricSet`;

        const timelineSpec: any = {
            aggregationPeriod: 'DAILY',
        };
        const startTime = parseDateString(startDate);
        const endTime = parseDateString(endDate);
        if (startTime) {
            timelineSpec.startTime = startTime;
        }
        if (endTime) {
            timelineSpec.endTime = endTime;
        }

        const res = await reporting.vitals.anrrate.query({
            name: resourceName,
            requestBody: {
                timelineSpec,
            },
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}
