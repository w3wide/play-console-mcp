import { getAuth } from '../auth.js';
import { getPackageName, wrapError } from '../utils.js';

export interface HandleListInAppProductsOptions {
    packageName?: string;
}

export async function handleListInAppProducts({ packageName }: HandleListInAppProductsOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.monetization.onetimeproducts.list({
            packageName: pkg,
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleListSubscriptionsOptions {
    packageName?: string;
}

export async function handleListSubscriptions({ packageName }: HandleListSubscriptionsOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.monetization.subscriptions.list({
            packageName: pkg,
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}
