import { JobDetail as SharedJobDetail } from '@porter/marketplace-ui';
import { Feedback } from './Feedback';
export { money, date, driverName, done } from '@porter/marketplace-ui';
export function JobDetail(props:{jobId?:string;admin?:boolean}) {
 return <SharedJobDetail {...props} renderFeedback={job=><Feedback job={job}/>}/>;
}
