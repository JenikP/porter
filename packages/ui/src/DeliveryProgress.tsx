import { Icon } from './Icon';
const stages=['Assigned','Pickup','In transit','Delivered'];
const statuses=['ASSIGNED','EN_ROUTE_TO_PICKUP','AT_PICKUP','PICKED_UP','EN_ROUTE_TO_DROPOFF','AT_DROPOFF','DELIVERED','COMPLETED'];
export function DeliveryProgress({status}:{status:string}) {
 const index=statuses.indexOf(status); const stage=index<0 ? -1 : index===0 ? 0 : index<4 ? 1 : index<6 ? 2 : 3;
 return <ol className="delivery-progress" aria-label="Delivery progress">{stages.map((label,i)=><li key={label} className={i<stage?'complete':i===stage?'current':''} aria-current={i===stage?'step':undefined}><span>{i<stage?<Icon name="check" size={14}/>:i+1}</span><small>{label}</small></li>)}</ol>;
}
