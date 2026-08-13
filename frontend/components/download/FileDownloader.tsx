'use client';

import { useState } from 'react';
import type React from 'react';

const SHORT_CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{3}(?:-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{3}){2}$/;

export default function FileDownloader() {
    const [code, setCode] = useState(''); 
    const [loading, setLoading] = useState(false); 
    const [errorMessage, setErrorMessage] = useState('');
    const [validationError, setValidationError] = useState(false);

    const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedCode = code.trim().toUpperCase();

        if (!SHORT_CODE_PATTERN.test(normalizedCode)) {
            setValidationError(true);
            setErrorMessage('');
            return;
        }

        setLoading(true);
        setErrorMessage('');
        setValidationError(false);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/download/${normalizedCode}`);

            if (!response.ok) {
                let message = 'The file could not be downloaded.';

                try {
                    const payload = await response.json() as { detail?: unknown };
                    if (typeof payload.detail === 'string' && payload.detail.trim()) {
                        message = payload.detail;
                    }
                } catch {
                    // Keep the fallback message when the server does not return JSON.
                }

                setErrorMessage(message);
                return;
            }

            const disposition = response.headers.get('Content-Disposition'); 
            const match = disposition?.match(/filename="?([^\"]+)"?/);

            const link = document.createElement('a'); 
            link.href = URL.createObjectURL(await response.blob()); 
            link.download = match?.[1] ?? 'download'; 
            link.click(); URL.revokeObjectURL(link.href);

        } catch {
            setErrorMessage('We could not reach the download service. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    return <div className="center-card">
        <p className="eyebrow">Already have a link?</p>
        <h1>Retrieve your file.</h1>
        <p>Enter the short code you were sent and we’ll take care of the rest.</p>
        <form onSubmit={submit}>
        <input className="form-input" value={code} maxLength={11} onChange={(e) => { setCode(e.target.value.toUpperCase()); setValidationError(false); setErrorMessage(''); }} placeholder="e.g. ABC-234-XYZ" aria-label="File short code" aria-invalid={validationError || Boolean(errorMessage)} />
            {validationError && <p className="form-error">Enter a valid key in the format ABC-234-XYZ.</p>}
            {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
            <button className="primary-button full-button" type="submit" disabled={loading || !code.trim()}>{loading ? 'Retrieving…' : 'Retrieve file'}</button>
        </form>
    </div>;
}
