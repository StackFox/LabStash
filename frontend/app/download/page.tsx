import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FileDownloader from '@/components/download/FileDownloader';

export default function DownloadPage() {
  return <div className="site-shell"><Navbar /><main className="page-main"><div className="container"><FileDownloader /></div></main><Footer /></div>;
}
