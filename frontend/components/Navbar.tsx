'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <div className="container nav-inner">
        <Link href="/" className="wordmark" aria-label="LabStash home">LabStash</Link>
        <nav className="nav-links" aria-label="Main navigation">
          <Link className="nav-link" aria-current="page" href="/">Transfer</Link>
          <a className="nav-link" href="#how-it-works">How it works</a>
          <a className="nav-link" href="#faq">Safety</a>
          <a className="nav-link" href="#faq">FAQ</a>
        </nav>
        <div className="nav-actions">
          <Link className="pill-button" href="/download">Retrieve a file</Link>
          <Link className="primary-button" href="/download">Retrieve with a key</Link>
        </div>
        <button className="mobile-toggle" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span aria-hidden="true">{open ? '×' : '☰'}</span>
        </button>
        {open && <nav className="mobile-menu" aria-label="Mobile navigation">
          <Link className="nav-link" href="/" onClick={() => setOpen(false)}>Transfer</Link>
          <a className="nav-link" href="#how-it-works" onClick={() => setOpen(false)}>How it works</a>
          <a className="nav-link" href="#faq" onClick={() => setOpen(false)}>Safety</a>
          <a className="nav-link" href="#faq" onClick={() => setOpen(false)}>FAQ</a>
          <Link className="pill-button" href="/download" onClick={() => setOpen(false)}>Retrieve a file</Link>
          <Link className="primary-button" href="/download" onClick={() => setOpen(false)}>Retrieve with a key</Link>
        </nav>}
      </div>
    </header>
  );
}
