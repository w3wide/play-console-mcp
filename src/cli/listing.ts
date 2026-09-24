import * as fs from 'fs';
import { getAuth } from '../auth.js';
import { getPackageName, wrapError } from '../utils.js';

export interface HandleGetStoreListingOptions {
    packageName?: string;
    editId: string;
    language: string;
}

export async function handleGetStoreListing({
    packageName,
    editId,
    language,
}: HandleGetStoreListingOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.listings.get({
            packageName: pkg,
            editId,
            language,
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleUpdateStoreListingOptions {
    packageName?: string;
    editId: string;
    language: string;
    title?: string;
    shortDescription?: string;
    fullDescription?: string;
}

export async function handleUpdateStoreListing({
    packageName,
    editId,
    language,
    title,
    shortDescription,
    fullDescription,
}: HandleUpdateStoreListingOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.listings.update({
            packageName: pkg,
            editId,
            language,
            requestBody: {
                title,
                shortDescription,
                fullDescription,
            },
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleListAllListingsOptions {
    packageName?: string;
    editId: string;
}

export async function handleListAllListings({ packageName, editId }: HandleListAllListingsOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.listings.list({ packageName: pkg, editId });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleUploadStoreImageOptions {
    packageName?: string;
    editId: string;
    imageType: string;
    imagePath: string;
    language: string;
}

export async function handleUploadStoreImage({
    packageName,
    editId,
    imageType,
    imagePath,
    language,
}: HandleUploadStoreImageOptions): Promise<void> {
    try {
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found at path: ${imagePath}`);
        }
        const stat = fs.statSync(imagePath);
        if (!stat.isFile()) {
            throw new Error(`Path is not a file: ${imagePath}`);
        }
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.images.upload({
            packageName: pkg,
            editId,
            language,
            imageType,
            media: {
                mimeType: imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg',
                body: fs.createReadStream(imagePath),
            },
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleDeleteStoreImageOptions {
    packageName?: string;
    editId: string;
    imageType: string;
    imageId: string;
    language: string;
}

export async function handleDeleteStoreImage({
    packageName,
    editId,
    imageType,
    imageId,
    language,
}: HandleDeleteStoreImageOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        await publisher.edits.images.delete({
            packageName: pkg,
            editId,
            language,
            imageType,
            imageId,
        });
        console.log(JSON.stringify({ status: 'success', message: `Image ${imageId} successfully deleted.` }, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleDeleteAllStoreImagesOptions {
    packageName?: string;
    editId: string;
    imageType: string;
    language: string;
}

export async function handleDeleteAllStoreImages({
    packageName,
    editId,
    imageType,
    language,
}: HandleDeleteAllStoreImagesOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.images.deleteall({
            packageName: pkg,
            editId,
            language,
            imageType,
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleListStoreImagesOptions {
    packageName?: string;
    editId: string;
    imageType: string;
    language: string;
}

export async function handleListStoreImages({
    packageName,
    editId,
    imageType,
    language,
}: HandleListStoreImagesOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.images.list({
            packageName: pkg,
            editId,
            language,
            imageType,
        });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}
