import * as fs from 'fs';
import { getAuth } from '../auth.js';
import { getPackageName, wrapError } from '../utils.js';

export interface HandleCreateEditOptions {
    packageName?: string;
}

export async function handleCreateEdit({ packageName }: HandleCreateEditOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.insert({ packageName: pkg });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleUploadAabOptions {
    packageName?: string;
    editId: string;
    aabPath: string;
}

export async function handleUploadAab({ packageName, editId, aabPath }: HandleUploadAabOptions): Promise<void> {
    try {
        if (!fs.existsSync(aabPath)) {
            throw new Error(`Android App Bundle file not found at path: ${aabPath}`);
        }
        const stat = fs.statSync(aabPath);
        if (!stat.isFile()) {
            throw new Error(`Path is not a file: ${aabPath}`);
        }
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
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleAssignTrackOptions {
    packageName?: string;
    editId: string;
    track: string;
    versionCode: number;
    userFraction?: number;
    status?: 'completed' | 'draft' | 'halted' | 'inProgress';
}

export async function handleAssignTrack({
    packageName,
    editId,
    track,
    versionCode,
    userFraction,
    status = 'completed',
}: HandleAssignTrackOptions): Promise<void> {
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
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleValidateEditOptions {
    packageName?: string;
    editId: string;
}

export async function handleValidateEdit({ packageName, editId }: HandleValidateEditOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.validate({ packageName: pkg, editId });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleCommitEditOptions {
    packageName?: string;
    editId: string;
}

export async function handleCommitEdit({ packageName, editId }: HandleCommitEditOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.commit({ packageName: pkg, editId });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleListTracksOptions {
    packageName?: string;
    editId: string;
}

export async function handleListTracks({ packageName, editId }: HandleListTracksOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.tracks.list({ packageName: pkg, editId });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}

export interface HandleGetTrackOptions {
    packageName?: string;
    editId: string;
    track: string;
}

export async function handleGetTrack({ packageName, editId, track }: HandleGetTrackOptions): Promise<void> {
    try {
        const pkg = getPackageName(packageName);
        const { publisher } = await getAuth();
        const res = await publisher.edits.tracks.get({ packageName: pkg, editId, track });
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error(wrapError(e));
        process.exitCode = 1;
    }
}
