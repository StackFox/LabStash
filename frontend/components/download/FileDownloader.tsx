'use client'
import { useState } from 'react'

const FileDownloader = () => {
    const [fileId, setFileId] = useState("")

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/download/${fileId}`)
            
            if (!response.ok) {
                console.error("File not found");
                return;
            }

            const disposition = response.headers.get("Content-Disposition");
            let filename = "download"
            if(disposition){
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match) filename = match[1];
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error(error);
        }

    }
    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type='text'
                    value={fileId}
                    onChange={(e) => { setFileId(e.target.value) }}
                    placeholder='Enter file code'
                />
                <button type="submit">Submit</button>
            </form>
        </div>
    )
}

export default FileDownloader
