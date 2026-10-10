import { Capacitor } from '@capacitor/core';
export const isNative=()=>Capacitor.isNativePlatform();
export async function takeHandoverPhoto(){
 const {Camera,CameraResultType,CameraSource}=await import('@capacitor/camera');
 const permission=await Camera.requestPermissions({permissions:['camera']});
 if(permission.camera!=='granted')throw new Error('Camera permission denied. You can choose an existing photo instead.');
 const photo=await Camera.getPhoto({source:CameraSource.Camera,resultType:CameraResultType.DataUrl,quality:55,width:1200,correctOrientation:true});
 if(!photo.dataUrl||photo.dataUrl.length>650000)throw new Error('Photo is too large. Choose a smaller image.');
 return photo.dataUrl;
}
export async function subscribeNativePush(save:(token:string,platform:string)=>Promise<void>){
 const {PushNotifications}=await import('@capacitor/push-notifications');
 if((await PushNotifications.requestPermissions()).receive!=='granted')throw new Error('Notification permission denied. In-app updates remain available.');
 let success:Awaited<ReturnType<typeof PushNotifications.addListener>>|undefined;let failure:typeof success;let timer:ReturnType<typeof setTimeout>|undefined;
 try{await new Promise<void>(async(resolve,reject)=>{try{timer=setTimeout(()=>reject(new Error('Push registration timed out. Check provider configuration and retry.')),15000);success=await PushNotifications.addListener('registration',token=>{save(token.value,Capacitor.getPlatform()).then(resolve,reject);});failure=await PushNotifications.addListener('registrationError',()=>reject(new Error('Native push registration failed. Check FCM/APNs configuration.')));await PushNotifications.register();}catch(e){reject(e);}});}finally{clearTimeout(timer);await success?.remove();await failure?.remove();}
}
export async function watchForegroundLocation(onPosition:(lat:number,lng:number)=>void,onError:(message:string)=>void):Promise<()=>void>{
 if(isNative()){
  const {Geolocation}=await import('@capacitor/geolocation');const permission=await Geolocation.requestPermissions();if(permission.location!=='granted'&&permission.coarseLocation!=='granted')throw new Error('Location permission denied. You can continue managing deliveries.');
  const id=await Geolocation.watchPosition({enableHighAccuracy:true,timeout:15000,minimumUpdateInterval:15000},(position,error)=>{if(error)onError('Location unavailable. Check permissions and retry.');else if(position)onPosition(position.coords.latitude,position.coords.longitude);});return ()=>{Geolocation.clearWatch({id}).catch(()=>{});};
 }
 if(!navigator.geolocation)throw new Error('Location is not supported on this device.');
 const id=navigator.geolocation.watchPosition(position=>onPosition(position.coords.latitude,position.coords.longitude),error=>onError(error.code===1?'Location permission denied. You can continue managing deliveries.':'Location unavailable. Check permissions and retry.'),{enableHighAccuracy:true,maximumAge:15000,timeout:15000});return ()=>navigator.geolocation.clearWatch(id);
}
