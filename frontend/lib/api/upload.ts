import { UploadResponse } from '@/types/file'

export interface UploadOptions {
    maxDownloads: number;
    expirySeconds: number;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percent: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const uploadFile = async (
    files: File[],
    options: UploadOptions,
    onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResponse> => {
    const formData = new FormData();

    files.forEach((file) => formData.append("files", file));
    formData.append("max_downloads", String(options.maxDownloads));
    formData.append("expiry_seconds", String(options.expirySeconds));

    return new Promise<UploadResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress({
                    loaded: event.loaded,
                    total: event.total,
                    percent: Math.round((event.loaded / event.total) * 100),
                });
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText) as UploadResponse);
                } catch {
                    reject(new Error("Invalid response from server."));
                }
            } else {
                reject(new Error("File upload failed."));
            }
        };

        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.ontimeout = () => reject(new Error("Upload timed out."));

        xhr.open("POST", `${API_URL}/api/upload`);
        xhr.send(formData);
    });
}
