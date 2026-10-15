import TemplateLibrary from './template-library';
import '../../videos/videos.css';
import './templates.css';
import { sharePreview } from '../../share-preview';

// The ATO Template Library: the Training Library's reference tile opens here. Data: content/ato-templates.json.
const description = 'Official sources for building an authorization package, arranged by RMF step and verified as publicly released by their publishers: CNSSI 1253, the CNSS Privacy Overlay, NIST\'s System Security Plan outline and DCSA\'s Risk Assessment Report template.';
export const metadata = {
  title: 'ATO Template Library',
  description,
  ...sharePreview('ATO Template Library | Secure By Design', description, '/training/ato-templates'),
};

export default function AtoTemplateLibraryPage() {
  return <TemplateLibrary />;
}
