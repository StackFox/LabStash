'use client';

import { uploadFile } from '@/lib/api/upload';
import QRGenerator from './QRGenerator';
import { useEffect, useRef, useState } from 'react';

function formatCountdown(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export default function FileUploader() {
    const [file, setFile] = useState<File | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
    const [shortCode, setShortCode] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<number | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [loading, setLoading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState(false);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (selected: File | null) => {
        if (!selected) return;
        setFile(selected);
        setError(false);
        setLoading(true);
        try {
            const result = await uploadFile(selected);
            setShortCode(result.short_code);
            setFileId(result.id);
            setExpiresAt(result.expires_at);
        }
        catch { setError(true); }
        finally { setLoading(false); }
    };
    const copy = async () => {
        if (!shortCode) return;
        await navigator.clipboard.writeText(`${window.location.origin}/download/${shortCode}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
    };
    useEffect(() => {
        if (!expiresAt) return;

        const updateCountdown = () => {
            setRemainingSeconds(Math.max(0, expiresAt - Math.floor(Date.now() / 1000)));
        };

        updateCountdown();
        const timer = window.setInterval(updateCountdown, 1000);
        return () => window.clearInterval(timer);
    }, [expiresAt]);

    const reset = () => {
        setFile(null);
        setFileId(null);
        setShortCode(null);
        setExpiresAt(null);
        setRemainingSeconds(0);
        setCopied(false);
        setError(false);
    };

    if (shortCode && fileId) return <div className="center-card" style={{ margin: '0 auto', textAlign: 'center' }}>
        <div className="status-icon" aria-hidden="true">✓</div>
        <h2>Ready to share.</h2>
        <p>Your file is uploaded and waiting for its next destination.</p>
        <div className="expiry-note" role="status" aria-live="polite">
            <span>Available for</span>
            <strong>{remainingSeconds > 0 ? formatCountdown(remainingSeconds) : 'Expired'}</strong>
        </div>
        <QRGenerator fileId={fileId} shortCode={shortCode} />
        <p className="eyebrow" style={{ marginBottom: 0 }}>Short code</p><div className="short-code">{shortCode}</div>
        <div className="share-row">
            <code>{`${typeof window !== 'undefined' ? window.location.origin : ''}/download/${shortCode}`}</code>
            <button className={`small-button ${copied ? 'is-copied' : ''}`} type="button" onClick={copy} aria-live="polite">
                {copied ? <>
                    <span className="copy-check" aria-hidden="true">✓</span> Copied</> : 'Copy link'}
            </button>
        </div>
        <button className="text-button" type="button" onClick={reset}>Upload another file</button>
    </div>;

    return <div
        className={`upload-zone ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }} onClick={() => !loading && inputRef.current?.click()}>
        <input ref={inputRef} type="file" hidden disabled={loading} onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        {loading ? <div><div className="upload-icon" aria-hidden="true">…</div>
            <p className="upload-title">Uploading {file?.name}</p>
            <p className="upload-subtitle">Keep this tab open for a moment.</p>
        </div> : <div>
            <div className="upload-icon" aria-hidden="true">↑</div>
            <p className="upload-title">Drop a file here</p>
            <p className="upload-subtitle">or choose one from your device</p>
            <button className="primary-button" type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>Choose file</button>
            {error &&
                <p className="form-error" style={{ marginTop: 16 }}>That upload didn’t go through. Try again.</p>}
        </div>}
    </div>;
}
