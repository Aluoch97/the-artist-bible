import { Link } from 'react-router-dom';
import { buttonVariants } from '../components/ui/button';

export function NotFound() {
  return (
    <section className="py-16 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">That page does not exist, or the link is out of date.</p>
      <Link to="/" className={`${buttonVariants({ variant: 'primary' })} mt-6`}>Back to home</Link>
    </section>
  );
}
