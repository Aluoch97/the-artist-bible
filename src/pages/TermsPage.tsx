import { Link } from 'react-router-dom';
import { ToolHeader } from '../components/ui/ToolHeader';

export function TermsPage() {
  return (
    <article>
      <ToolHeader title="Terms of use" description="The ground rules for using The Artist Bible, in plain English." />
      <p className="-mt-3 mb-6 text-sm text-muted">Last updated: November 2026</p>

      <div className="chapter-prose prose max-w-none">
        <ul>
          <li><strong>Created by NuRenaissance Media.</strong> The Artist Bible, including its design, guides and tools, was created by NuRenaissance Media.</li>
          <li><strong>Educational information only.</strong> Nothing here is legal, financial or tax advice. Fees, rules and deadlines change. Check official sources and talk to an entertainment attorney before signing anything.</li>
          <li><strong>AI can be wrong.</strong> The contract checks, especially the AI review, can miss problems or misread clauses, and they cannot tell you whether a deal is right for you. They are a way to know what to ask, not a substitute for an entertainment attorney.</li>
          <li><strong>Documents are tools, not contracts.</strong> A split sheet PDF records what collaborators say they agreed. It may not be enough on its own for a binding agreement in your situation.</li>
          <li><strong>No warranty.</strong> The app and content are provided &quot;as is&quot;, without guarantees of accuracy or availability, and we are not liable for decisions made using them.</li>
          <li><strong>Not affiliated.</strong> This project is not affiliated with or endorsed by ASCAP, BMI, The MLC, SoundExchange, Spotify, Apple, Amazon, GitHub or any other company named. Names and trademarks belong to their owners and are used only to identify them.</li>
        </ul>
        <p>How your information is handled is covered in the <Link to="/privacy">Privacy policy</Link>.</p>
      </div>
    </article>
  );
}
