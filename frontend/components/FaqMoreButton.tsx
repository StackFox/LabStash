'use client';

import { useState } from 'react';
import FaqItem from '@/components/FaqItem';

const EXTRA_FAQS = [
    { q: 'Is there a file size limit?', a: 'Each file can be up to 50 MB and you can upload multiple files at once with a combined limit of 500 MB.' },
    { q: 'Can I upload multiple files at once?', a: 'Yes. Select as many files as you need and they will all be bundled into a single ZIP when you download.' },
    { q: 'How many times can I download my files?', a: 'You choose the limit when uploading — 1, 3, 5, 10, or 25 downloads. Once the limit is reached the upload is no longer available.' },
];

export default function FaqMoreButton() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {expanded &&
        EXTRA_FAQS.map((faq) => (
          <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
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
