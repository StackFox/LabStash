import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return <footer className="site-footer">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand"><Link href="/" className="wordmark"><Image src="/icon.svg" alt="" className="nav-logo" width={28} height={28} />LabStash</Link></div>
        <div><p className="footer-heading">LabStash</p><div className="footer-links"><Link href="/">Transfer a file</Link><Link href="/download">Retrieve a file</Link></div></div>
        <div><p className="footer-heading">Support</p><div className="footer-links"><a href="#faq">FAQ</a><a href="mailto:hello@labstash.dev">Contact us</a></div></div>
        <div><p className="footer-heading">Learn</p><div className="footer-links"><a href="#how-it-works">How it works</a><a href="#faq">File safety</a></div></div>
      </div>
      <p className="copyright">© 2026 LabStash. Files in, files out.</p>
      <p className="copyright">Made with ❤️ by <a href="https://github.com/StackFox" target="_blank" rel="noopener noreferrer">@StackFox</a> · <a href="https://rakshit.codes" target="_blank" rel="noopener noreferrer">rakshit.codes</a></p>
    </div>
  </footer>;
}
