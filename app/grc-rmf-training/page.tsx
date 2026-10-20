import PackageBuilderHub from './package-builder-hub';
import library from '../../content/videos.json';
import '../videos/videos.css';
import './builder-hub.css';
import { sharePreview } from '../share-preview';
import type { Library } from '../videos/catalog-types';

// The ATO Package Builder Hub (owner direction, 19 October 2026): the ATO Package Builder as its own section. Course 2.1
// and the ATO Template Library are in the Training Hub; their addresses under /grc-rmf-training are unchanged.
const description = 'Practice taking a system to an Authorization to Operate: register the Secure By Design enclave in the ATO Package Builder and work through all seven RMF steps, with each step\'s lessons and templates in the Training Hub.';
export const metadata = {
  title: 'ATO Package Builder Hub',
  description,
  ...sharePreview('ATO Package Builder Hub | Secure By Design', description, '/grc-rmf-training'),
};

export default function AtoPackageBuilderHubPage() {
  return <PackageBuilderHub library={library as unknown as Library} />;
}
