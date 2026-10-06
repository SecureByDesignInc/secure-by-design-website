import posts from './article-progress.json' with {type:'json'};
import training from './training-progress.json' with {type:'json'};
export const progressCatalog = [
 ...training,
 ...['Prepare','Categorize','Select','Implement','Assess','Authorize','Monitor'].map(title=>({id:'rmf:'+title.toLowerCase(),title,href:'/rmf-series#'+title.toLowerCase(),group:'RMF lifecycle'})),
 ...posts.map(post=>({id:'article:'+post.slug,title:post.title,href:'/blog/'+post.slug,group:'Technical articles'})),
 ...[['orientation','See the system behind the screen'],['domain','Active Directory foundations'],['linux-discovery','Linux system discovery'],['monitoring','Security monitoring as a lifecycle'],['rmf','Follow the RMF lifecycle']].map(([id,title])=>({id:'path:'+id,title,href:'/cyber-range#your-path',group:'Learning path'})),
];
// Retain every recognized ID for existing accounts; availability only changes the dashboard.
export const activeProgressCatalog = progressCatalog.filter(item=>!['RMF lifecycle','Technical articles'].includes(item.group));
const activeProgressIds = new Set(activeProgressCatalog.map(item=>item.id));
/** @template {{id:string}} T @param {readonly T[]} records @returns {T[]} */
export const filterActiveProgressRecords = records => records.filter(record=>activeProgressIds.has(record.id));
export const validProfile = value => !!value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).length===3 && ['new','hands-on','practitioner'].includes(value.experience) && ['infrastructure','defense','rmf'].includes(value.goal) && ['short','guided','sprint'].includes(value.pace);
