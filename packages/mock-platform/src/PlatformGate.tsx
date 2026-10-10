import { Component, useEffect, useState, type ReactNode } from 'react';
import { useMockPlatform } from './react';
import { resetMockPlatformState } from './persistence';
export function PlatformGate({ children }: { children:ReactNode }) {
 const p = useMockPlatform(); const mode = p.demoSettings?.connection ?? 'online'; const [loading,setLoading] = useState(mode === 'slow');
 useEffect(() => { setLoading(mode === 'slow'); const timer = window.setTimeout(() => setLoading(false),650); return () => window.clearTimeout(timer); }, [mode]);
 if (mode === 'offline') return <main className="role-page"><section className="panel" role="alert"><h1>Demo connection interrupted</h1><p>Your saved marketplace records are safe on this device.</p><button className="primary" onClick={() => p.setDemoConnection('online')}>Try again · restore connection</button></section></main>;
 if (loading) return <main className="role-page"><section className="panel" role="status" aria-busy="true"><h1>Loading marketplace…</h1><p>Simulating a slow connection.</p><div aria-hidden="true"><div className="skeleton short"/><div className="skeleton large"/><div className="skeleton"/></div></section></main>;
 return <>{children}</>;
}
export class PlatformErrorBoundary extends Component<{ children:ReactNode }, { failed:boolean }> {
 state={ failed:false }; static getDerivedStateFromError() { return { failed:true }; }
 render() { return this.state.failed ? <main className="role-page"><section className="panel" role="alert"><h1>Unable to render this demo</h1><p>Reload to retry with your saved records, or reset the demo if those records are invalid.</p><button className="primary" onClick={() => window.location.reload()}>Reload page</button><button className="secondary" onClick={() => { resetMockPlatformState(); window.location.reload(); }}>Reset invalid demo data</button></section></main> : this.props.children; }
}
