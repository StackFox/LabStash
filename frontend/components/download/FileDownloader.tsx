'use client';

import { downloadUpload, listFiles, DownloadApiError } from '@/lib/api/download';
import type { StoredFile } from '@/types/file';
import { useEffect, useState } from 'react';
import type React from 'react';

const SHORT_CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{3}(?:-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{3}){2}$/;

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDownloader() {
    const [code, setCode] = useState('');
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [downloadsRemaining, setDownloadsRemaining] = useState<number | null>(null);
    const [maxDownloads, setMaxDownloads] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [retryAfter, setRetryAfter] = useState(0);
    const [validationError, setValidationError] = useState(false);

    useEffect(() => {
        if (retryAfter <= 0) return;
        const timer = window.setInterval(() => setRetryAfter((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => window.clearInterval(timer);
    }, [retryAfter]);

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedCode = code.trim().toUpperCase();

        if (!SHORT_CODE_PATTERN.test(normalizedCode)) {
            setValidationError(true);
            setErrorMessage('');
            setRetryAfter(0);
            return;
        }

        setLoading(true);
        setFiles([]);
        setErrorMessage('');
        setRetryAfter(0);
        setValidationError(false);

        try {
            const manifest = await listFiles(normalizedCode);
            if (!manifest.files.length) {
                setDownloadsRemaining(null);
                setMaxDownloads(null);
                setErrorMessage('This upload does not contain any files.');
                return;
            }
            setFiles(manifest.files);
            if (typeof manifest.downloads_remaining === 'number') {
                setDownloadsRemaining(Math.max(0, manifest.downloads_remaining));
            }
            if (typeof manifest.max_downloads === 'number') {
                setMaxDownloads(Math.max(0, manifest.max_downloads));
            }
        } catch (error) {
            setDownloadsRemaining(null);
            setMaxDownloads(null);
            if (error instanceof DownloadApiError) {
                setErrorMessage(error.message);
                setRetryAfter(error.retryAfter);
            } else {
                setErrorMessage('We could not reach the download service. Please try again.');
                setRetryAfter(0);
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadAll = async () => {
        setDownloading(true);
        setErrorMessage('');
        setRetryAfter(0);
        try {
            await downloadUpload(code.trim().toUpperCase(), 'labstash-download.zip');
            setDownloadsRemaining((remaining) => remaining === null ? remaining : Math.max(0, remaining - 1));
        } catch (error) {
            if (error instanceof DownloadApiError) {
                setErrorMessage(error.message);
                setRetryAfter(error.retryAfter);
            } else {
                setErrorMessage('The files could not be downloaded.');
            }
        } finally {
            setDownloading(false);
        }
    };

    return <div className="center-card">
        <p className="eyebrow">Already have a key?</p>
        <h1>Retrieve your files.</h1>
        <p>Enter the short code you were sent to see every file in the upload.</p>
        <form onSubmit={submit}>
            <input className="form-input" value={code} maxLength={11} onChange={(e) => { setCode(e.target.value.toUpperCase()); setValidationError(false); setErrorMessage(''); setRetryAfter(0); setFiles([]); setDownloadsRemaining(null); setMaxDownloads(null); }} placeholder="e.g. ABC-234-XYZ" aria-label="Upload short code" aria-invalid={validationError || Boolean(errorMessage)} />
            {validationError && <p className="form-error">Enter a valid key in the format ABC-234-XYZ.</p>}
            {errorMessage && <p className="form-error" role="alert">{errorMessage}{retryAfter > 0 && ` — try again in ${retryAfter}s`}</p>}
            <button className="primary-button full-button" type="submit" disabled={loading || !code.trim()}>{loading ? 'Finding files…' : 'Find files'}</button>
        </form>
        {files.length > 0 && <div className="retrieved-files" aria-live="polite">
            <div className="retrieved-files-heading">
                <div className="retrieved-files-summary">
                    <span>{files.length} {files.length === 1 ? 'file' : 'files'} found</span>
                    {downloadsRemaining !== null && <span className="downloads-remaining" role="status">
                        {downloadsRemaining} download{downloadsRemaining === 1 ? '' : 's'} remaining{maxDownloads !== null && ` of ${maxDownloads}`}
                    </span>}
                </div>
                <button className="small-button" type="button" onClick={downloadAll} disabled={downloading || downloadsRemaining === 0}>
                    {downloading ? 'Preparing ZIP…' : downloadsRemaining === 0 ? 'Limit reached' : 'Download ZIP'}
                </button>
            </div>
            {files.map((file) => <div className="retrieved-file" key={file.file_id}>
                <div className="file-meta"><strong className="file-name">{file.filename}</strong><span>{formatBytes(file.size_bytes)}</span></div>
            </div>)}
        </div>}
    </div>;
}
