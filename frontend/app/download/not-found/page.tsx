import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FileNotFoundPage() {
  return <div className="site-shell">
    <Navbar />
    <main className="page-main">
      <div className="container">
        <div className="center-card download-card">
          <div className="download-icon" aria-hidden="true">?</div>
          <h1>File not found.</h1>
          <p>This file may have expired or the download key may be incorrect.</p>
          <Link className="primary-button full-button" href="/download">
            Try another key
          </Link>
          <Link className="text-button" href="/" style={{ display: 'inline-block', marginTop: 18 }}>
            Upload a new file
          </Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>;
}
