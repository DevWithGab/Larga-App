import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SavedRoutesPanel from '../components/SavedRoutesPanel';
import { useSavedRoutes } from '../hooks/useSavedRoutes';
import { Page, PageHeader } from '../components/PageHeader';
import { Button } from '../components/ui/button';

export default function SavedRoutesPage() {
  const saved = useSavedRoutes();
  const navigate = useNavigate();
  return <Page><PageHeader title="Saved routes" description="Your usual routes, directions, and boarding notes." action={<Button asChild variant="outline"><Link to="/routes">Browse routes<ArrowRight className="size-4" /></Link></Button>} />
    <SavedRoutesPanel saved={saved} onOpen={(item) => navigate('/map', { state: { filter: item.routeId, direction: item.direction === 'reverse' ? 'reverse' : 'forward' } })} />
  </Page>;
}
