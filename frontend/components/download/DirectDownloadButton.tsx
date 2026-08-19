'use client';

import { downloadUpload, DownloadApiError } from '@/lib/api/download';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Props {
  fileId: string;
}

export default function DirectDownloadButton({ fileId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryAfter, setRetryAfter] = useState(0);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = window.setInterval(() => setRetryAfter((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [retryAfter]);

  const downloadZip = async () => {
    setLoading(true);
    setError('');
    setRetryAfter(0);
    try {
      await downloadUpload(fileId, 'labstash-download.zip');
    } catch (caughtError) {
      const apiError = caughtError instanceof DownloadApiError ? caughtError : null;
      if (apiError?.status === 404) {
        router.push('/download/not-found');
        return;
      }
      setError(apiError?.message ?? 'The files could not be retrieved.');
      setRetryAfter(apiError?.retryAfter ?? 0);
    } finally {
      setLoading(false);
    }
  };

  return <>
    <button className="primary-button full-button" onClick={downloadZip} disabled={loading}>{loading ? 'Preparing ZIP…' : 'Download all files ↗'}</button>
    {error && <p className="form-error" role="alert">{error}{retryAfter > 0 && ` — try again in ${retryAfter}s`}</p>}
  </>;
}
