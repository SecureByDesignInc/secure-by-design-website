import Workspace from './workspace';
import './workspace.css';
import {sharePreview} from '../share-preview';
const description='Practice taking a system through an Authorization to Operate: system record, controls, Body of Evidence, POA&M, package review and decision, and continuous monitoring.';
export const metadata={title:'Authorization Workspace',description,robots:{index:false,follow:false},...sharePreview('Authorization Workspace | Secure By Design',description,'/authorization-workspace')};
export const dynamic='force-dynamic';
export default function Page(){return <main id="main" className="awx-page"><div className="container reader-page"><Workspace/></div></main>}
