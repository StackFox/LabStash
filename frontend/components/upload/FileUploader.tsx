'use client';

import { uploadFile } from "@/lib/api/upload";
import Link from "next/link";
import { useState } from "react";

const FileUploader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true)

        try {
            const result = await uploadFile(file)
            setFileId(result.id);
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <input
                type="file"
                onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                }}
            />

            <button onClick={handleUpload} disabled={!file || loading}>
                {loading ? "Uploading..." : "Upload"}
            </button>

            {fileId && (
                <p>
                    Access URL:{' '}
                    <Link href={`/download/${fileId}`}>
                        {`${process.env.NEXT_PUBLIC_HOST_URL}/download/${fileId}`}
                    </Link>
                </p>
            )}
        </div>
    )
}

export default FileUploader