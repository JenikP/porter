import { statusConfig } from './design-tokens';
import { Icon } from './Icon';
interface StatusChipProps { status:string; showIcon?:boolean; size?:'sm'|'md' }
export function StatusChip({status,showIcon=true,size='md'}:StatusChipProps) {
 const cfg=statusConfig[status];
 const tone=['CANCELLED','UNMATCHED','FAILED','REJECTED','EXPIRED'].includes(status)?'error':['SEARCHING','DISPUTED','UNDER_REVIEW','OPEN','PENDING','ACTION_REQUIRED'].includes(status)?'warning':['COMPLETED','DELIVERED','APPROVED','CAPTURED','RESOLVED'].includes(status)?'success':'info';
 const icon=tone==='error'||tone==='warning'?'shield':tone==='success'?'check':status==='SEARCHING'?'search':'truck';
 return <span className={`status-chip status-chip--${tone} status-chip--${size}`}>{showIcon&&<Icon name={icon} size={14}/>}<span>{cfg?.label ?? status.replace(/_/g,' ').toLowerCase().replace(/^./,(c:string)=>c.toUpperCase())}</span></span>;
}
