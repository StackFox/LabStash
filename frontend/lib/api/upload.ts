import { UploadResponse } from '@/types/file'

export interface UploadOptions {
    maxDownloads: number;
    expirySeconds: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const uploadFile = async (file: File, options: UploadOptions): Promise<UploadResponse> => {
    try {
        const formData = new FormData();

        formData.append("file", file)
        formData.append("max_downloads", String(options.maxDownloads));
        formData.append("expiry_seconds", String(options.expirySeconds));

        const response = await fetch(`${API_URL}/api/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("File upload failed.");
        }

        const data: UploadResponse = await response.json()
        return data;
    }
    catch (error) {
        throw error;
    }
}
