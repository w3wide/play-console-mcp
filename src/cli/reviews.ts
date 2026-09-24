import { getAuth } from '../auth.js';
import { getPackageName, wrapError } from '../utils.js';

export interface HandleListReviewsOptions {
    packageName?: string;
    maxResults?: number;
    startIndex?: number;
    token?: string;
}

export async function handleListReviews({
    packageName,
    maxResults,
    startIndex,
    token,
}: HandleListReviewsOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.reviews.list({
            packageName: pkg,
            maxResults,
            startIndex,
            token,
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleGetReviewOptions {
    packageName?: string;
    reviewId: string;
}

export async function handleGetReview({ packageName, reviewId }: HandleGetReviewOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.reviews.get({
            packageName: pkg,
            reviewId,
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleReplyReviewOptions {
    packageName?: string;
    reviewId: string;
    replyText: string;
}

export async function handleReplyReview({
    packageName,
    reviewId,
    replyText,
}: HandleReplyReviewOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.reviews.reply({
            packageName: pkg,
            reviewId,
            requestBody: { replyText },
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}
