import { mountFooterShare } from './footer-share.mjs';

for (const root of document.querySelectorAll('[data-footer-share]')) {
  mountFooterShare(root, navigator);
}
