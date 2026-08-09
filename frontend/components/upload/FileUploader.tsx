'use client';

import { uploadFile } from "@/lib/api/upload";
import Link from "next/link";
import { useState } from "react";

const FileUploader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
    const [shortCode, setShortCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true)

        try {
            const { id, short_code, expires_at } = await uploadFile(file)
            setFileId(id);
            setShortCode(short_code);
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
                <div>
                    <p>
                        Access URL:{' '}
                        <Link href={`/download/${fileId}`}>
                            {`${process.env.NEXT_PUBLIC_HOST_URL}/download/${shortCode}`}
                        </Link>
                    </p>
                    <h1 className="bold">{`${shortCode}`}</h1>
                </div>
            )}
        </div>
    )
}

export default FileUploader