// Install only the shell. Never put authenticated API data, proofs or documents in a cache.
export function registerMobileShell(){
 if(location.protocol.startsWith('http')&&'serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{/* App still works if installation is unavailable. */});});
}
