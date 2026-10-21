import TemplateLibrary from './template-library';
import '../../videos/videos.css';
import '../../videos/training-hub.css';
import './templates.css';
import { sharePreview } from '../../share-preview';

// The ATO Template Library, in the Training Hub (owner direction, 19 October 2026; its address stays under /grc-rmf-training). Data: content/ato-templates.json.
const description = 'Templates for building an authorization package, arranged by RMF step. Official sources for each step are coming soon; Secure By Design training samples are available now.';
export const metadata = {
  title: 'ATO Template Library',
  description,
  ...sharePreview('ATO Template Library | Secure By Design', description, '/grc-rmf-training/templates'),
};

export default function AtoTemplateLibraryPage() {
  return <TemplateLibrary />;
}
