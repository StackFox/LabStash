import type { ManifestResponse, StoredFile } from '@/types/file';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MANIFEST_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_MANIFEST_CACHE_ENTRIES = 100;

interface ManifestCacheEntry {
    files: StoredFile[];
    cachedAt: number;
}

const manifestCache = new Map<string, ManifestCacheEntry>();
const manifestRequests = new Map<string, Promise<ManifestResponse>>();

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
        // The file list is safe to cache, but download counters are dynamic.
        return { files: cached.files };
    }

    if (cached) manifestCache.delete(cacheKey);

    const pendingRequest = manifestRequests.get(cacheKey);
    if (pendingRequest) return pendingRequest;

    const request = (async () => {
        const response = await fetch(`${API_URL}/api/files/${encodeURIComponent(cacheKey)}`);
        if (!response.ok) {
            const error = await getError(response, 'The files could not be retrieved.');
            throw new DownloadApiError(error.message, response.status, error.retryAfter);
        }

        const payload = await response.json() as ManifestResponse;
        const files = payload.files ?? [];

        manifestCache.set(cacheKey, { files, cachedAt: Date.now() });
        while (manifestCache.size > MAX_MANIFEST_CACHE_ENTRIES) {
            const oldestKey = manifestCache.keys().next().value;
            if (oldestKey) manifestCache.delete(oldestKey);
        }

        return payload;
    })().finally(() => {
        manifestRequests.delete(cacheKey);
    });

    manifestRequests.set(cacheKey, request);
    return request;
}

export async function downloadUpload(identifier: string, fallbackFilename = 'labstash-download.zip') {
    const response = await fetch(`${API_URL}/api/download/${identifier}`);
    if (!response.ok) {
        const error = await getError(response, 'The files could not be downloaded.');
        throw new DownloadApiError(error.message, response.status, error.retryAfter);
    }

    const disposition = response.headers.get('Content-Disposition');
    const match = disposition?.match(/filename="?([^\"]+)"?/);
    const objectUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = match?.[1] ?? fallbackFilename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
