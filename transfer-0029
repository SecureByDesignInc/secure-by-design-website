'use client';

import { useEffect, useRef } from 'react';
import {
  mountFooterShare,
  renderFooterShare,
} from '../public/footer-share.mjs';

const markup = renderFooterShare();

export default function FooterShare() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (host.current)
      return mountFooterShare(host.current, navigator);
  }, []);
  return (
    <div
      className="footer-share-host"
      ref={host}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
