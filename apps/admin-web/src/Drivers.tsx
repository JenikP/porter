import {useSession} from '@porter/app-session';
import {LegacyDrivers} from './LegacyDrivers';
import {DriverApplications} from './DriverApplications';
export function Drivers(props:{run:(f:()=>void)=>void}) {return useSession()?<DriverApplications {...props}/>:<LegacyDrivers {...props}/>;}
