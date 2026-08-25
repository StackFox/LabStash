'use client';

import { useState } from 'react';

interface Props {
  question: string;
  answer: string;
}

export default function FaqItem({ question, answer }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`faq-item ${open ? 'faq-item--open' : ''}`}>
      <button
        className="faq-question"
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="faq-chevron" aria-hidden="true">›</span>
        <span>{question}</span>
      </button>
      {open && <div className="faq-answer" role="region">{answer}</div>}
    </div>
  );
}
