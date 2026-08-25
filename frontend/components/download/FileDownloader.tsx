'use client';

import { deleteUpload, downloadUpload, listFiles, DownloadApiError } from '@/lib/api/download';
import type { StoredFile } from '@/types/file';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

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
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const [deleted, setDeleted] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [retryAfter, setRetryAfter] = useState(0);
    const [validationError, setValidationError] = useState(false);
    const operationRef = useRef(0);

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

        const operation = ++operationRef.current;
        setLoading(true);
        setFiles([]);
        setUploadId(null);
        setDeleted(false);
        setDeleteError('');
        setErrorMessage('');
        setRetryAfter(0);
        setValidationError(false);

        try {
            const manifest = await listFiles(normalizedCode);
            if (operation !== operationRef.current) return;
            setUploadId(manifest.upload_id ?? null);
            if (!manifest.files.length) {
                setUploadId(null);
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
            if (operation !== operationRef.current) return;
            setUploadId(null);
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
            if (operation === operationRef.current) setLoading(false);
        }
    };

    const downloadAll = async () => {
        const operation = operationRef.current;
        const normalizedCode = code.trim().toUpperCase();
        setDownloading(true);
        setErrorMessage('');
        setRetryAfter(0);
        try {
            await downloadUpload(uploadId ?? normalizedCode, 'labstash-download.zip');
            if (operation !== operationRef.current) return;
            setDownloadsRemaining((remaining) => remaining === null ? remaining : Math.max(0, remaining - 1));
        } catch (error) {
            if (operation !== operationRef.current) return;
            if (error instanceof DownloadApiError) {
                setErrorMessage(error.message);
                setRetryAfter(error.retryAfter);
            } else {
                setErrorMessage('The files could not be downloaded.');
            }
        } finally {
            if (operation === operationRef.current) setDownloading(false);
        }
    };

    const deleteNow = async () => {
        if (downloadsRemaining !== 0 || deleting) return;
        setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (downloadsRemaining !== 0 || deleting) return;

        setConfirmDeleteOpen(false);
        const operation = operationRef.current;
        const identifier = uploadId ?? code.trim().toUpperCase();
        setDeleting(true);
        setDeleteError('');
        try {
            await deleteUpload(identifier);
            if (operation !== operationRef.current) return;
            setFiles([]);
            setUploadId(null);
            setDownloadsRemaining(null);
            setMaxDownloads(null);
            setDeleteSuccessMessage('Upload deleted successfully.');
            setDeleted(true);
        } catch (error) {
            if (operation !== operationRef.current) return;
            setDeleteError(error instanceof Error ? error.message : 'The upload could not be deleted.');
        } finally {
            if (operation === operationRef.current) setDeleting(false);
        }
    };

    const reset = () => {
        if (deleting) return;
        ++operationRef.current;
        setCode('');
        setFiles([]);
        setUploadId(null);
        setDownloadsRemaining(null);
        setMaxDownloads(null);
        setErrorMessage('');
        setDeleteError('');
        setDeleteSuccessMessage('');
        setConfirmDeleteOpen(false);
        setRetryAfter(0);
        setValidationError(false);
        setDeleted(false);
    };

    const handleCodeChange = (value: string) => {
        ++operationRef.current;
        setLoading(false);
        setDownloading(false);
        setCode(value.toUpperCase());
        setValidationError(false);
        setErrorMessage('');
        setDeleteError('');
        setRetryAfter(0);
        setFiles([]);
        setUploadId(null);
        setDownloadsRemaining(null);
        setMaxDownloads(null);
        setDeleted(false);
    };

    if (deleted) return <>
        <div className="center-card">
            <p className="eyebrow">Upload removed</p>
            <h1>Upload deleted.</h1>
            <p>Your upload is no longer available for download.</p>
            <div className="delete-success-actions">
                <div className="success-toast" role="status" aria-live="polite">✓ {deleteSuccessMessage}</div>
                <button className="text-button" type="button" onClick={reset} disabled={deleting}>Find another upload</button>
            </div>
        </div>
        <DeleteConfirmDialog open={confirmDeleteOpen} busy={deleting} onCancel={() => setConfirmDeleteOpen(false)} onConfirm={confirmDelete} />
    </>;

    return <div className="center-card">
        <p className="eyebrow">Already have a key?</p>
        <h1>Retrieve your files.</h1>
        <p>Enter the short code you were sent to see every file in the upload.</p>
        <form onSubmit={submit}>
            <input id="upload-short-code" className="form-input" value={code} maxLength={11} onChange={(e) => handleCodeChange(e.target.value)} placeholder="e.g. ABC-234-XYZ" aria-label="Upload short code" aria-describedby="short-code-validation-error" aria-invalid={validationError || Boolean(errorMessage) || Boolean(deleteError)} disabled={deleting} />
            {validationError && <p id="short-code-validation-error" className="form-error" role="alert">Enter a valid key in the format ABC-234-XYZ.</p>}
            {errorMessage && <p className="form-error" role="alert">{errorMessage}{retryAfter > 0 && ` — try again in ${retryAfter}s`}</p>}
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <button className="primary-button full-button" type="submit" disabled={loading || deleting || !code.trim()}>{loading ? 'Finding files…' : 'Find files'}</button>
        </form>
        {files.length > 0 && <div className="retrieved-files" aria-live="polite">
            <div className="retrieved-files-heading">
                <div className="retrieved-files-summary">
                    <span>{files.length} {files.length === 1 ? 'file' : 'files'} found</span>
                    {downloadsRemaining !== null && <span className="downloads-remaining" role="status">
                        {downloadsRemaining} download{downloadsRemaining === 1 ? '' : 's'} remaining{maxDownloads !== null && ` of ${maxDownloads}`}
                    </span>}
                </div>
                <button className="small-button" type="button" onClick={downloadAll} disabled={downloading || deleting || downloadsRemaining === 0}>
                    {downloading ? 'Preparing ZIP…' : downloadsRemaining === 0 ? 'Limit reached' : 'Download ZIP'}
                </button>
            </div>
            {files.map((file) => <div className="retrieved-file" key={file.file_id}>
                <div className="file-meta"><strong className="file-name">{file.filename}</strong><span>{formatBytes(file.size_bytes)}</span></div>
            </div>)}
            {downloadsRemaining === 0 && <button className="secondary-button" type="button" onClick={deleteNow} disabled={deleting}>
                {deleting ? 'Deleting upload…' : 'Delete this upload now'}
            </button>}
        </div>}
        <DeleteConfirmDialog open={confirmDeleteOpen} busy={deleting} onCancel={() => setConfirmDeleteOpen(false)} onConfirm={confirmDelete} />
    </div>;
}
