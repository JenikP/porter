import { Navigation, PageHeader } from '@porter/ui';
import { useNavigate } from 'react-router-dom';

export function PlaceholderPage({
  title,
  activeNav,
}: {
  title: string;
  activeNav: 'home' | 'jobs' | 'help' | 'account';
}) {
  const navigate = useNavigate();
  return (
    <div className="pb-24">
      <PageHeader title={title} description="This section will be expanded in upcoming build tasks." />
      <Navigation
        variant="bottom"
        items={[
          { id: 'home', label: 'Home', active: activeNav === 'home', onClick: () => navigate('/') },
          { id: 'jobs', label: 'Jobs', active: activeNav === 'jobs', onClick: () => navigate('/jobs') },
          { id: 'help', label: 'Help', active: activeNav === 'help', onClick: () => navigate('/help') },
          {
            id: 'account',
            label: 'Account',
            active: activeNav === 'account',
            onClick: () => navigate('/account'),
          },
        ]}
      />
    </div>
  );
}
