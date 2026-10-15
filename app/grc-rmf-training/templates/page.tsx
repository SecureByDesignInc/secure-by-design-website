import TemplateLibrary from './template-library';
import '../../videos/videos.css';
import './templates.css';
import { sharePreview } from '../../share-preview';

// The ATO Template Library, in the GRC & RMF Training Library (/grc-rmf-training). Data: content/ato-templates.json.
const description = 'Official sources for building an authorization package, arranged by RMF step and verified as publicly released by their publishers: CNSSI 1253, NIST control baselines and SSP outline, DCSA appointment letter and RAR templates, POA&M guidance, and FedRAMP formats for the traceability matrix, inventory and continuous monitoring.';
export const metadata = {
  title: 'ATO Template Library',
  description,
  ...sharePreview('ATO Template Library | Secure By Design', description, '/grc-rmf-training/templates'),
};

export default function AtoTemplateLibraryPage() {
  return <TemplateLibrary />;
}
