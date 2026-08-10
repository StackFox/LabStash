import Link from 'next/link';

export default function Footer() {
  return <footer className="site-footer">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand"><Link href="/" className="wordmark">LabStash</Link></div>
        <div><p className="footer-heading">LabStash</p><div className="footer-links"><Link href="/">Transfer a file</Link><Link href="/download">Retrieve a file</Link></div></div>
        <div><p className="footer-heading">Support</p><div className="footer-links"><a href="#faq">FAQ</a><a href="mailto:hello@labstash.dev">Contact us</a></div></div>
        <div><p className="footer-heading">Learn</p><div className="footer-links"><a href="#how-it-works">How it works</a><a href="#faq">File safety</a></div></div>
      </div>
      <p className="copyright">© 2026 LabStash. Files in, files out.</p>
    </div>
  </footer>;
}
