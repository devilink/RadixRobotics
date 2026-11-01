"use client";

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked (e.g. insecure context): leave the button as is */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="flex h-[36px] items-center gap-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5400]"
      aria-label={copied ? 'Copied' : 'Copy code'}
    >
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
