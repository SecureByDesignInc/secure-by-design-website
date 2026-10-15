import TemplateLibrary from './template-library';
import '../../videos/videos.css';
import './templates.css';
import { sharePreview } from '../../share-preview';

// The ATO Template Library: the Training Library's reference tile opens here. Data: content/ato-templates.json.
const description = 'Free, official templates for every major ATO package artifact, including DoD SAP, JSIG and CNSS templates, from NIST, CNSS, DoD and DCSA, FedRAMP and GovRAMP. Each one links to its publisher and is tagged with its status and RMF tasks.';
export const metadata = {
  title: 'ATO Template Library',
  description,
  ...sharePreview('ATO Template Library | Secure By Design', description, '/training/ato-templates'),
};

export default function AtoTemplateLibraryPage() {
  return <TemplateLibrary />;
}
