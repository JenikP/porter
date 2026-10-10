import { useState } from 'react';
import { Icon } from '@porter/ui';
import { useSession } from '@porter/app-session';
const groups=[['Marketplace',['Overview','Jobs','Live Map','Drivers','Customers','Disputes']],['Finance',['Pricing','Payments','Reports']],['Workspace',['Settings','Audit Log']]] as const;
const icons:Record<string,string>={Overview:'home',Jobs:'jobs','Live Map':'map',Drivers:'drivers',Customers:'account',Disputes:'shield',Pricing:'pricing',Payments:'payments',Reports:'reports',Settings:'settings','Audit Log':'jobs'};
export function Sidebar({tab,onSelect}:{tab:string;onSelect:(tab:string)=>void}) {
 const [collapsed,setCollapsed]=useState(false);
 const session=useSession();const allowed=(tab:string)=>session?.user.role!=='SUPPORT_ADMIN'||!['Pricing','Settings'].includes(tab);
 return <aside className={`operations-sidebar ${collapsed?'is-collapsed':''}`}><div className="sidebar-heading"><span>Operations</span><button aria-label={collapsed?'Expand navigation':'Collapse navigation'} aria-expanded={!collapsed} onClick={()=>setCollapsed(v=>!v)}><Icon name={collapsed?'menu':'collapse'}/></button></div><nav aria-label="Admin navigation">{groups.map(([label,tabs])=><section key={label}><p>{label}</p>{tabs.filter(allowed).map(t=><button key={t} title={t} aria-label={t} aria-current={tab===t?'page':undefined} onClick={()=>onSelect(t)}><Icon name={icons[t]}/><span>{t}</span></button>)}</section>)}</nav><div className="sidebar-footer"><Icon name="pin"/><span>Melbourne · AUD<br/><small>{session ? session.user.role.replaceAll("_"," ") : "Frontend demo"}</small></span></div></aside>;
}

