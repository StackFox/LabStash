import { UploadResponse } from '@/types/file'

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const uploadFile = async (file: File): Promise<UploadResponse> => {
    try {
        const formData = new FormData();

        formData.append("file", file)

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