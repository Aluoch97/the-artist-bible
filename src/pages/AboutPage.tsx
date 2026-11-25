import { Link } from 'react-router-dom';
import { ToolHeader } from '../components/ui/ToolHeader';
import { ExternalLink } from '../components/ui/ExternalLink';
import { industryData } from '../data';

export function AboutPage() {
  return (
    <article>
      <ToolHeader title="About" description="Plain English, no tricks. The short version: it's free, it has no accounts, and what you type stays on your device." />

      <div className="chapter-prose prose max-w-none">
        <h2>What this is</h2>
        <p>The Artist Bible is a free project created by <strong>NuRenaissance Media</strong>: plain-English guides and a few tools (release planner, royalty checklist, split sheet, red-flag decoder) for independent recording artists. It is not a law firm, a label, a distributor or a financial adviser.</p>

        <h2>Who it&apos;s for</h2>
        <p>The royalty, PRO, mechanical and neighboring-rights information here describes the <strong>United States</strong>. If you release music elsewhere, your country has its own collection societies and rules, though the split-sheet and release tools still apply.</p>

        <h2 id="install">Install it on your phone</h2>
        <ul>
          <li><strong>iPhone or iPad:</strong> tap the Share button in your browser, then <strong>Add to Home Screen</strong>.</li>
          <li><strong>Android (Chrome):</strong> tap <strong>Install</strong> at the top of the app, or open the browser menu and choose <strong>Install app</strong>.</li>
          <li><strong>Computer (Chrome or Edge):</strong> click the install icon in the address bar.</li>
        </ul>
        <p>Once installed it opens full screen and works offline. Your saved work lives on the device, and browsers can clear saved data for sites you haven&apos;t installed, so download a backup now and then (the backup button, top right).</p>

        <h2>Privacy and terms</h2>
        <p>
          How your information is handled is in the <Link to="/privacy">Privacy policy</Link>. The rules for using the app, including that it is educational and not legal advice, are in the <Link to="/terms">Terms of use</Link>.
        </p>

        <h2>Accessibility</h2>
        <p>We aim for WCAG 2.2 AA: keyboard use, screen readers, readable contrast and zoom all matter. If something blocks you, please tell us.</p>

        <h2 id="contact">Contact and corrections</h2>
        <p>
          Found something wrong or out of date? <ExternalLink href={`${industryData.site.githubRepo}/issues/new`}>Open an issue on GitHub</ExternalLink>. Every guide also has a &quot;Spot outdated info?&quot; link at the bottom.
        </p>
      </div>
    </article>
  );
}
