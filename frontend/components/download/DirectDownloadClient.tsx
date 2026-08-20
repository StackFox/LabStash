'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DirectDownloadButton from '@/components/download/DirectDownloadButton';
import { listFiles, DownloadApiError } from '@/lib/api/download';
import type { StoredFile } from '@/types/file';

interface Props {
  identifier: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Status = 'loading' | 'ready' | 'expired' | 'not-found' | 'error';

export default function DirectDownloadClient({ identifier }: Props) {
  const [status, setStatus] = useState<Status>('loading');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [downloadsRemaining, setDownloadsRemaining] = useState<number | null>(null);
  const [maxDownloads, setMaxDownloads] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const manifest = await listFiles(identifier);
        if (cancelled) return;
        setFiles(manifest.files ?? []);
        if (typeof manifest.downloads_remaining === 'number') {
          setDownloadsRemaining(manifest.downloads_remaining);
        }
        if (typeof manifest.max_downloads === 'number') {
          setMaxDownloads(manifest.max_downloads);
        }
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DownloadApiError) {
          if (err.status === 410) {
            setStatus('expired');
          } else if (err.status === 404) {
            setStatus('not-found');
          } else {
            setErrorMessage(err.message);
            setStatus('error');
          }
        } else {
          setErrorMessage('We could not reach the download service. Please try again.');
          setStatus('error');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [identifier]);

  if (status === 'loading') {
    return <div className="site-shell">
      <Navbar />
      <main className="page-main">
        <div className="container">
          <div className="center-card download-card">
            <div className="download-icon" aria-hidden="true">↓</div>
            <p className="upload-subtitle">Checking your files…</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>;
  }

  if (status === 'expired') {
    return <div className="site-shell">
      <Navbar />
      <main className="page-main">
        <div className="container">
          <div className="center-card download-card">
            <div className="download-icon expired-icon" aria-hidden="true">Expired</div>
            <h1>These files have expired.</h1>
            <p>The time window for this upload has passed and the files are no longer available.</p>
            <Link className="primary-button full-button" href="/download">Try another key</Link>
            <Link className="text-button" href="/" style={{ display: 'inline-block', marginTop: 18 }}>Upload a new file</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>;
  }

  if (status === 'not-found') {
    return <div className="site-shell">
      <Navbar />
      <main className="page-main">
        <div className="container">
          <div className="center-card download-card">
            <div className="download-icon" aria-hidden="true">?</div>
            <h1>File not found.</h1>
            <p>This file may have expired or the download key may be incorrect.</p>
            <Link className="primary-button full-button" href="/download">Try another key</Link>
            <Link className="text-button" href="/" style={{ display: 'inline-block', marginTop: 18 }}>Upload a new file</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>;
  }

  if (status === 'error') {
    return <div className="site-shell">
      <Navbar />
      <main className="page-main">
        <div className="container">
          <div className="center-card download-card">
            <div className="download-icon" aria-hidden="true">!</div>
            <h1>Something went wrong.</h1>
            <p>{errorMessage}</p>
            <Link className="primary-button full-button" href="/download">Try another key</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>;
  }

  return <div className="site-shell">
    <Navbar />
    <main className="page-main">
      <div className="container">
        <div className="center-card download-card">
          <div className="download-icon" aria-hidden="true">↓</div>
          <h1>Your files are ready.</h1>
          <p>{files.length} {files.length === 1 ? 'file' : 'files'} in this upload. Download them all as a ZIP.</p>
          {downloadsRemaining !== null && maxDownloads !== null && (
            <div className="expiry-note" role="status" style={{ display: 'inline-flex', marginBottom: 20 }}>
              <span>Downloads remaining</span>
              <strong>{downloadsRemaining} {downloadsRemaining === 1 ? 'download' : 'downloads'} {maxDownloads !== null && `of ${maxDownloads}`}</strong>
            </div>
          )}
          {downloadsRemaining === 0 ? (
            <p className="form-error" role="alert">The download limit for this upload has been reached.</p>
          ) : (
            <DirectDownloadButton fileId={identifier} />
          )}
          {files.length > 0 && (
            <div className="retrieved-files" aria-live="polite" style={{ textAlign: 'left' }}>
              <div className="retrieved-files-heading">
                <span>File list</span>
              </div>
              {files.map((file) => (
                <div className="retrieved-file" key={file.file_id}>
                  <div className="file-meta">
                    <strong className="file-name">{file.filename}</strong>
                    <span>{formatBytes(file.size_bytes)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
    <Footer />
  </div>;
}
