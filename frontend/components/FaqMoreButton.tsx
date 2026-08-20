'use client';

import { useState } from 'react';

const EXTRA_FAQS = [
    'Is there a file size limit?',
    'Can I upload multiple files at once?',
    'How many times can I download my files?',
];

export default function FaqMoreButton() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {expanded &&
        EXTRA_FAQS.map((faq) => (
          <div className="faq-item" key={faq}>
            <span aria-hidden="true">›</span>
            <div>{faq}</div>
          </div>
        ))}
      <button
        className="secondary-button faq-more"
        type="button"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? '\u2212 Show less' : '+ Show more'}
      </button>
    </>
  );
}
