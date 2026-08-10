import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Props { params: Promise<{ file_id: string }> }

export default async function DirectDownloadPage({ params }: Props) {
  const { file_id } = await params;
  return <div className="site-shell"><Navbar /><main className="page-main"><div className="container"><div className="center-card download-card"><div className="download-icon" aria-hidden="true">↓</div><h1>Your file is ready.</h1><p>One click and it’s back where it belongs.</p><a className="primary-button full-button" href={`${process.env.NEXT_PUBLIC_API_URL}/api/download/${file_id}`}>Download file ↗</a></div></div></main><Footer /></div>;
}
