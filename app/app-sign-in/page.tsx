import AppSignIn from './app-sign-in';
import '../reader-progress.css';
import '../my-progress/my-progress.css';
export const metadata={title:'Sign in to the app',description:'Sign in to the Secure By Design app.',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default function Page(){return <main id="main" className="container reader-page"><AppSignIn/></main>}
