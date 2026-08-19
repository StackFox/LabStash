import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DirectDownloadButton from '@/components/download/DirectDownloadButton';

interface Props { params: Promise<{ file_id: string }> }

export default async function DirectDownloadPage({ params }: Props) {
  const { file_id } = await params;

  return <div className="site-shell">
    <Navbar />
    <main className="page-main">
      <div className="container">
        <div className="center-card download-card">
          <div className="download-icon" aria-hidden="true">↓</div>
          <h1>Your files are ready.</h1>
          <p>Find every file from this upload and download them individually or together.</p>
          <DirectDownloadButton fileId={file_id} />
        </div>
      </div>
    </main>
    <Footer />
  </div>;
}
