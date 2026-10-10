import { Icon } from '@porter/ui';
import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccountPage } from './pages/AccountPage';
import { HelpPage } from './pages/HelpPage';
import { PlatformGate } from '@porter/mock-platform';
import { BookingPage } from './pages/BookingPage';
import { JobDetail } from './pages/JobDetail';
import { JobsPage } from './pages/JobsPage';

export function App() {
  const navigate = useNavigate(); const location = useLocation();
  return (
    <PlatformGate><main className="role-page customer-page">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="*" element={<HelpPage />} />
      </Routes>
      <nav className="bottom-nav" aria-label="Customer navigation">{[['Home','/','home'],['Jobs','/jobs','jobs'],['Help','/help','help'],['Account','/account','account']].map(([label,url,icon]) => <button key={url} aria-current={location.pathname === url || (url==='/jobs' && location.pathname.startsWith('/jobs/')) ? 'page' : undefined} onClick={() => navigate(url)}><Icon name={icon}/><span>{label}</span></button>)}</nav>
    </main></PlatformGate>
  );
}
