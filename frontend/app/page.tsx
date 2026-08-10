import FileUploader from '@/components/upload/FileUploader';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const steps = [
  ['01', 'Upload from the lab computer', 'Choose your files without signing in to a personal account.'],
  ['02', 'Get a unique key', 'LabStash creates a private key for your temporary upload.'],
  ['03', 'Download it later', 'Use the key when you are home or back on another computer.'],
];

const faqs = ['How long are my files available?', 'Do I need a Google account?', 'Can I upload files larger than an email attachment?', 'Where do I find my download key?', 'What happens when a file expires?'];

export default function Home() {
  return <div className="site-shell"><Navbar /><main>
    <section className="hero"><div className="container hero-grid">
      <div><p className="eyebrow">Temporary storage for computer labs</p><h1 className="display-serif">Take your work home.<br /><em>Not your account.</em></h1><p className="hero-copy">Upload your files before you leave the lab. LabStash keeps them temporary and gives you a unique key to download them later — no Google login, no 25 MB email limit, no forgotten sign-out.</p><div className="hero-actions"><a className="pill-button" href="#how-it-works">How it works</a><a className="nav-link" href="#faq">Learn about file safety ↓</a></div><p className="hero-note">Built for the last five minutes of a lab session.</p></div>
      <div className="hero-uploader" id="transfer"><FileUploader /></div>
    </div></section>

    <section className="section" id="how-it-works"><div className="container"><div className="section-heading"><div><p className="eyebrow">Three simple steps</p><h2 className="display-serif">From lab computer<br />to your own device.</h2></div><p className="section-intro">A small escape hatch for the moment when emailing yourself is the only option left.</p></div><div className="step-grid">{steps.map(([number, title, copy]) => <article className="step-card" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>

    <section className="section"><div className="container"><div className="api-callout"><div><p className="eyebrow">Designed for shared computers</p><h2 className="display-serif">No personal account left behind.</h2><p>Keep your Google account signed out. Skip the attachment limit. Upload what you need, take the key with you, and let the temporary storage do the rest.</p></div><a className="primary-button" href="#transfer">Upload a file ↑</a></div></div></section>

    <section className="section" id="faq"><div className="container"><div className="section-heading"><div><p className="eyebrow">Good questions</p><h2 className="display-serif">Frequently asked.</h2></div></div><div className="faq-list">{faqs.map((faq) => <div className="faq-item" key={faq}><span aria-hidden="true">›</span><div>{faq}</div></div>)}</div><button className="secondary-button faq-more" type="button">+ Show more</button></div></section>
  </main><Footer /></div>;
}
