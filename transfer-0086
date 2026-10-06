'use client';

import { useId, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { learningShareNote } from '../../public/footer-share.mjs';
import {
  copyTrainingLink,
  shareTrainingLink,
  trainingShareUrl,
} from './training-share-utils.mjs';

type ShareOutcome = Awaited<ReturnType<typeof shareTrainingLink>>;
const feedback: Record<ShareOutcome, string> = {
  opened: 'Share options opened.',
  copied: 'Link copied. Ready to pass it on.',
  cancelled: 'You can copy the link instead.',
  manual: 'Select and copy the link below to pass it on.',
};

export default function TrainingShare({ compact = false, closing = false, label = 'Pass it on' }: { compact?: boolean; closing?: boolean; label?: string }) {
  const id = useId();
  const active = useRef(false);
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null);
  const [manual, setManual] = useState(false);

  async function passItOn(copyOnly = false) {
    if (active.current) return;
    active.current = true;
    setPending(true);
    setOutcome(null);
    try {
      const result = await (copyOnly
        ? copyTrainingLink(navigator)
        : shareTrainingLink(navigator));
      setOutcome(result);
      if (result === 'cancelled' || result === 'manual') setManual(true);
    } finally {
      active.current = false;
      setPending(false);
    }
  }

  return (
    <div className={`vc-training-share${compact ? ' vc-training-share-compact' : ''}${closing ? ' vc-training-share-closing' : ''}`}>
      {!compact && <div className="vc-share-message">
        {closing ? <p>{learningShareNote}</p> : <><h5>Pay us back by sharing our content.</h5>
        <p>Share Secure By Design. Your recommendation is our reward.</p></>}
      </div>}
      <button
        type="button"
        className="vc-share-button"
        disabled={pending}
        onClick={() => passItOn()}
      >
        <Share2 size={15} aria-hidden="true" />
        {label}
      </button>
      <output className="vc-share-feedback" aria-live="polite" aria-atomic="true">
        {pending ? 'Please wait…' : outcome ? feedback[outcome] : ''}
      </output>
      {manual && (
        <div className="vc-share-manual">
          <label htmlFor={id}>Secure By Design homepage</label>
          <input
            id={id}
            type="text"
            readOnly
            value={trainingShareUrl}
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            type="button"
            className="vc-share-button"
            disabled={pending}
            onClick={() => passItOn(true)}
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
