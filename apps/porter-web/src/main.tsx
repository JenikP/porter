import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { Icon } from '@porter/ui';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { MockPlatformProvider, PlatformErrorBoundary } from '@porter/mock-platform';
import { App as Customer } from '../../customer-web/src/app';
import { App as Driver } from '../../driver-web/src/app';
import { App as Admin } from '../../admin-web/src/app';
import '../../customer-web/src/styles.css';
import '../../../packages/ui/src/premium-v2.css';

function Demo() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark,setDark] = useState(()=>localStorage.getItem('porter.theme') === 'dark');
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('porter.theme',dark?'dark':'light');},[dark]);
  const role = location.pathname.startsWith('/driver') ? 'driver' : location.pathname.startsWith('/admin') ? 'admin' : 'customer';
  return <><a className="skip-link" href="#main-content">Skip to content</a><header className="demo-bar"><a href="/" className="wordmark">Porter</a><nav aria-label="Demo role">{['customer', 'driver', 'admin'].map(r => <button key={r} aria-pressed={role === r} onClick={() => navigate(r === 'customer' ? '/' : `/${r}`)}><Icon name={r==='customer'?'account':r==='driver'?'truck':'settings'} size={18}/>{r[0].toUpperCase() + r.slice(1)}</button>)}</nav><div className="shell-tools"><small>Connected Melbourne demo · AUD</small><button className="theme-toggle" aria-label={dark?'Switch to light theme':'Switch to dark theme'} onClick={()=>setDark(v=>!v)}><Icon name={dark?'sun':'moon'} size={18}/></button></div></header><div id="main-content">{role === 'customer' ? <Customer /> : role === 'driver' ? <Driver /> : <Admin />}</div></>;
}
createRoot(document.getElementById('root')!).render(<PlatformErrorBoundary><MockPlatformProvider><BrowserRouter><Demo /></BrowserRouter></MockPlatformProvider></PlatformErrorBoundary>);