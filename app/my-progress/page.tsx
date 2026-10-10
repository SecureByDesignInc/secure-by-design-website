import ProgressDashboard from './progress-dashboard';
import '../memberships/memberships.css';
import './my-progress.css';
import {sharePreview} from '../share-preview';
export const metadata={title:'My Account',description:'Your learning progress, account, and membership options in one place on Secure By Design.',robots:{index:false,follow:false},...sharePreview('My Account | Secure By Design','Your learning progress, account, and membership options in one place on Secure By Design.','/my-progress')};
export const dynamic='force-dynamic';
export default function Page(){return <main id="main" className="account-page"><div className="container reader-page"><ProgressDashboard/></div></main>}
