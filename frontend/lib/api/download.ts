import type { ManifestResponse, StoredFile } from '@/types/file';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MANIFEST_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_MANIFEST_CACHE_ENTRIES = 100;

interface ManifestCacheEntry {
    files: StoredFile[];
    upload_id?: string;
    download_count?: number;
    max_downloads?: number;
    downloads_remaining?: number;
    cachedAt: number;
}

const manifestCache = new Map<string, ManifestCacheEntry>();
const manifestRequests = new Map<string, { generation: number; promise: Promise<ManifestResponse> }>();
let manifestCacheGeneration = 0;

export class DownloadApiError extends Error {
    constructor(message: string, public readonly status: number, public readonly retryAfter = 0) {
        super(message);
        this.name = 'DownloadApiError';
    }
}

async function getError(response: Response, fallback: string) {
    try {
        const payload = await response.json() as { detail?: unknown };
        if (typeof payload.detail === 'object' && payload.detail !== null) {
            const detail = payload.detail as { message?: unknown; retry_after?: unknown };
            const message = typeof detail.message === 'string' && detail.message.trim() ? detail.message : fallback;
            const retryAfter = typeof detail.retry_after === 'number' && Number.isFinite(detail.retry_after)
                ? Math.max(0, Math.ceil(detail.retry_after))
                : 0;
            return { message, retryAfter };
        }

        if (typeof payload.detail === 'string' && payload.detail.trim()) {
            return { message: payload.detail, retryAfter: 0 };
        }
    } catch {
        // Keep the fallback message when the server does not return JSON.
    }

    return { message: fallback, retryAfter: 0 };
}

export async function listFiles(identifier: string): Promise<ManifestResponse> {
    const cacheKey = identifier.trim().toUpperCase();
    const cached = manifestCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < MANIFEST_CACHE_TTL_MS) {
        // Refresh insertion order so the cache behaves like a small LRU.
        manifestCache.delete(cacheKey);
        manifestCache.set(cacheKey, cached);
        // Return cached data including download metadata counters.
        return { files: cached.files,
            upload_id: cached.upload_id,
            download_count: cached.download_count,
            max_downloads: cached.max_downloads,
            downloads_remaining: cached.downloads_remaining };
    }

    if (cached) manifestCache.delete(cacheKey);

    const pendingRequest = manifestRequests.get(cacheKey);
    if (pendingRequest) {
        if (pendingRequest.generation === manifestCacheGeneration) return pendingRequest.promise;
        manifestRequests.delete(cacheKey);
    }

    const requestGeneration = manifestCacheGeneration;
    const request = (async () => {
        const response = await fetch(`${API_URL}/api/files/${encodeURIComponent(cacheKey)}`);
        if (!response.ok) {
            const error = await getError(response, 'The files could not be retrieved.');
            throw new DownloadApiError(error.message, response.status, error.retryAfter);
        }

        const payload = await response.json() as ManifestResponse;
        const files = payload.files ?? [];

        if (requestGeneration === manifestCacheGeneration) {
            manifestCache.set(cacheKey, { files,
                upload_id: payload.upload_id,
                download_count: payload.download_count,
                max_downloads: payload.max_downloads,
                downloads_remaining: payload.downloads_remaining,
                cachedAt: Date.now() });
            while (manifestCache.size > MAX_MANIFEST_CACHE_ENTRIES) {
                const oldestKey = manifestCache.keys().next().value;
                if (oldestKey) manifestCache.delete(oldestKey);
            }
        }

        return payload;
    })().finally(() => {
        const currentRequest = manifestRequests.get(cacheKey);
        if (currentRequest?.promise === request) manifestRequests.delete(cacheKey);
    });

    manifestRequests.set(cacheKey, { generation: requestGeneration, promise: request });
    return request;
}

export async function downloadUpload(identifier: string, fallbackFilename = 'labstash-download.zip') {
    const response = await fetch(`${API_URL}/api/download/${encodeURIComponent(identifier)}`);
    if (!response.ok) {
        const error = await getError(response, 'The files could not be downloaded.');
        throw new DownloadApiError(error.message, response.status, error.retryAfter);
    }

    // Invalidate the manifest cache so download counters are fresh on next lookup.
    manifestCacheGeneration += 1;
    manifestCache.clear();

    const disposition = response.headers.get('Content-Disposition');
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = match?.[1] ?? fallbackFilename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function deleteUpload(uploadId: string) {
    const response = await fetch(`${API_URL}/api/delete/${encodeURIComponent(uploadId)}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await getError(response, 'The upload could not be deleted.');
        throw new DownloadApiError(error.message, response.status, error.retryAfter);
    }

    manifestCacheGeneration += 1;
    manifestCache.clear();
}
