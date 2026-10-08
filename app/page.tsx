import TemplateHome from './template-home';
import './saleshook-effects.css';
import './template-home.css';
import { sharePreview } from './share-preview';
export const metadata = {title: {absolute: 'Secure By Design — Cybersecurity Starts with Curiosity'}, description: 'Straightforward conversations about cybersecurity, technology, and compliance. Bring your curiosity and explore Secure By Design.', ...sharePreview('Secure By Design — Cybersecurity Starts with Curiosity', 'Straightforward conversations about cybersecurity, technology, and compliance. Bring your curiosity and explore Secure By Design.', '/')};
export default function Home() { return <TemplateHome />; }
