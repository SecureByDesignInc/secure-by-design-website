import TemplateLibrary from './template-library';
import '../../videos/videos.css';
import './templates.css';
import { sharePreview } from '../../share-preview';

// The ATO Template Library: the Training Library's reference tile opens here. Data: content/ato-templates.json.
const description = 'The DoD SAP / JSIG templates an authorization package is built from, arranged by RMF step: SSP, SCTM, RAR, POA&M, ConMon strategy, appointment letter and more to download, with official sources for the rest of the Body of Evidence.';
export const metadata = {
  title: 'ATO Template Library',
  description,
  ...sharePreview('ATO Template Library | Secure By Design', description, '/training/ato-templates'),
};

export default function AtoTemplateLibraryPage() {
  return <TemplateLibrary />;
}
