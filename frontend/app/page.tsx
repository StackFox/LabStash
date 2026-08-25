import FileUploader from '@/components/upload/FileUploader';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FaqItem from '@/components/FaqItem';
import FaqMoreButton from '@/components/FaqMoreButton';

const steps = [
  ['01', 'Upload from the lab computer', 'Choose your files without signing in to a personal account.'],
  ['02', 'Get a unique key', 'LabStash creates a private key for your temporary upload.'],
  ['03', 'Download it later', 'Use the key when you are home or back on another computer.'],
];

const faqs = [
  { q: 'How long are my files available?', a: 'Files are available for a short window you choose at upload — from 5 minutes up to 1 hour. After that they are permanently deleted.' },
  { q: 'Do I need a Google account?', a: 'No. LabStash works entirely without signing in. Upload your files, grab the key, and download later on any device.' },
  { q: 'Can I upload files larger than an email attachment?', a: 'Yes. Each file can be up to 50 MB and you can upload multiple files at once, with a combined limit of 500 MB.' },
  { q: 'Where do I find my download key?', a: 'After uploading you will see a short code like ABC-234-XYZ and a QR code. Save the code or scan the QR to open the download page later.' },
  { q: 'What happens when a file expires?', a: 'Once the time window closes the files are permanently deleted from storage and cannot be recovered.' },
];

export default function Home() {
  return <div className="site-shell"><Navbar /><main>
    <section className="hero"><div className="container hero-grid">
      <div><p className="eyebrow">Temporary storage for computer labs</p><h1 className="display-serif">Take your work home.<br /><em>Not your account.</em></h1><p className="hero-copy">Upload your files before you leave the lab. LabStash keeps them temporary and gives you a unique key to download them later — no Google login, no 25 MB email limit, no forgotten sign-out.</p><div className="hero-actions"><a className="pill-button" href="#how-it-works">How it works</a><a className="nav-link" href="#faq">Learn about file safety ↓</a></div><p className="hero-note">Built for the last five minutes of a lab session.</p></div>
      <div className="hero-uploader" id="transfer"><FileUploader /></div>
    </div></section>

    <section className="section" id="how-it-works"><div className="container"><div className="section-heading"><div><p className="eyebrow">Three simple steps</p><h2 className="display-serif">From lab computer<br />to your own device.</h2></div><p className="section-intro">A small escape hatch for the moment when emailing yourself is the only option left.</p></div><div className="step-grid">{steps.map(([number, title, copy]) => <article className="step-card" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

    <section className="section" id="api-callout"><div className="container"><div className="api-callout"><div><p className="eyebrow">Designed for shared computers</p><h2 className="display-serif">No personal account left behind.</h2><p>Keep your Google account signed out. Skip the attachment limit. Upload what you need, take the key with you, and let the temporary storage do the rest.</p></div><a className="primary-button" href="#transfer">Upload a file ↑</a></div></div></section>

    <section className="section" id="faq"><div className="container"><div className="section-heading"><div><p className="eyebrow">Good questions</p><h2 className="display-serif">Frequently asked.</h2></div></div><div className="faq-list">{faqs.map((faq) => <FaqItem key={faq.q} question={faq.q} answer={faq.a} />)}<FaqMoreButton /></div></div></section>
  </main><Footer /></div>;
}
