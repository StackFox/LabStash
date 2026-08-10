'use client';

import { useState } from 'react';
import type React from 'react';

export default function FileDownloader() {
    const [code, setCode] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState(false);

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(false);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/download/${code.trim()}`);

            if (!response.ok) throw new Error('not found');

            const disposition = response.headers.get('Content-Disposition'); const match = disposition?.match(/filename="?([^\"]+)"?/);

            const link = document.createElement('a'); link.href = URL.createObjectURL(await response.blob()); link.download = match?.[1] ?? 'download'; link.click(); URL.revokeObjectURL(link.href);

        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };
    return <div className="center-card">
        <p className="eyebrow">Already have a link?</p>
        <h1>Retrieve your file.</h1>
        <p>Enter the short code you were sent and we’ll take care of the rest.</p>
        <form onSubmit={submit}>
            <input className="form-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 7xk2p9" aria-label="File short code" />
            {error && <p className="form-error">We couldn’t find that file. It may have expired.</p>}
            <button className="primary-button full-button" type="submit" disabled={loading || !code.trim()}>{loading ? 'Retrieving…' : 'Retrieve file'}</button>
        </form>
    </div>;
}
