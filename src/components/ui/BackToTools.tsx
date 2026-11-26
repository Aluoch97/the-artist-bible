import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BackToTools() {
  return (
    <Link to="/tools" className="no-print mb-3 inline-flex min-h-11 items-center gap-1 text-[0.9375rem] font-semibold text-muted hover:text-fg">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All tools
    </Link>
  );
}
