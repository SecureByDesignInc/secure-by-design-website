import Workspace from './workspace';
import './workspace.css';
import {sharePreview} from '../../share-preview';
const description='Practice taking a system through an Authorization to Operate: system record, controls, Body of Evidence, POA&M, package review and decision, and continuous monitoring.';
export const metadata={title:'ATO Package Builder',description,robots:{index:false,follow:false},...sharePreview('ATO Package Builder | Secure By Design',description,'/grc-rmf-training/workspace')};
export const dynamic='force-dynamic';
export default function Page(){return <main id="main" className="awx-page"><div className="container reader-page"><Workspace/></div></main>}
