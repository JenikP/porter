import { useSession } from '@porter/app-session';
import { LegacyDocuments } from './LegacyDocuments';
import { OnboardingWizard } from './OnboardingWizard';
export function Documents(props: {driverId:string;run:(f:()=>void)=>void;onExit?:()=>void}) {
 return useSession() ? <OnboardingWizard driverId={props.driverId} onExit={props.onExit}/> : <LegacyDocuments driverId={props.driverId} run={props.run}/>;
}
