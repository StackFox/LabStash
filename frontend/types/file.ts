export interface UploadResponse {
    id: string;
    short_code: string
    expires_at: number;
}

export interface StoredFile {
    file_id: string;
    filename: string;
    size_bytes: number;
}

export interface ManifestResponse {
    files: StoredFile[];
    download_count?: number;
    max_downloads?: number;
    downloads_remaining?: number;
}
