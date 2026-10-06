import {redirect} from 'next/navigation';
export const metadata={title:'My Account',robots:{index:false,follow:false}};
export default async function Account({searchParams}:{searchParams:Promise<{returnTo?:string}>}){
 const {returnTo}=await searchParams;
 redirect('/my-progress'+(returnTo?'?returnTo='+encodeURIComponent(returnTo):'')+'#account');
}
