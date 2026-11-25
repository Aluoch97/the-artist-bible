import { ToolHeader } from '../components/ui/ToolHeader';
import { ExternalLink } from '../components/ui/ExternalLink';
import { industryData } from '../data';

export function AboutPage() {
  return (
    <article>
      <ToolHeader title="About, privacy & terms" description="Plain English, no tricks. The short version: it's free, it has no accounts, and what you type stays on your device." />

      <div className="chapter-prose prose max-w-none">
        <h2>What this is</h2>
        <p>The Artist Bible is a free, independent project: plain-English guides and a few tools (release planner, royalty checklist, split sheet, red-flag decoder) for independent recording artists. It is not a law firm, a label, a distributor or a financial adviser.</p>

        <h2>Privacy</h2>
        <ul>
          <li><strong>No accounts, no ads, no tracking.</strong> The app has no analytics, no advertising, no cookies and no third-party scripts or fonts.</li>
          <li><strong>What you type stays on your device.</strong> Checklists, release plans and split-sheet drafts (including names and PRO/IPI numbers you enter) are saved in your browser&apos;s local storage. We never receive them.</li>
          <li><strong>Backups are yours.</strong> The backup file you download contains everything you entered. Store it somewhere you trust, and share it only with people you intend to.</li>
          <li><strong>Hosting.</strong> The site is served by Cloudflare. Like any web host, it may keep standard server logs (for example IP address and pages requested) for security and operations. The app itself does not read or use them.</li>
          <li><strong>Links out.</strong> Links to other sites (PROs, The MLC, SoundExchange, streaming platforms, GitHub) open in a new tab. Those sites have their own privacy policies. The &quot;Spot outdated info?&quot; and &quot;Report a problem&quot; links open a pre-filled GitHub issue that only contains what you see there; nothing is sent unless you submit it.</li>
          <li><strong>Erasing your data.</strong> Use the backup button (top right) and choose &quot;Erase local data&quot;, or clear this site&apos;s data in your browser settings.</li>
        </ul>

        <h2>Terms of use</h2>
        <ul>
          <li><strong>Educational information only.</strong> Nothing here is legal, financial or tax advice. Fees, rules and deadlines change. Check official sources and talk to an entertainment attorney before signing anything.</li>
          <li><strong>Documents are tools, not contracts.</strong> A split sheet PDF records what collaborators say they agreed. It may not be enough on its own for a binding agreement in your situation.</li>
          <li><strong>No warranty.</strong> The app and content are provided &quot;as is&quot;, without guarantees of accuracy or availability, and we are not liable for decisions made using them.</li>
          <li><strong>Not affiliated.</strong> This project is not affiliated with or endorsed by ASCAP, BMI, The MLC, SoundExchange, Spotify, Apple, Amazon, GitHub or any other company named. Names and trademarks belong to their owners and are used only to identify them.</li>
        </ul>

        <h2>Accessibility</h2>
        <p>We aim for WCAG 2.2 AA: keyboard use, screen readers, readable contrast and zoom all matter. If something blocks you, please tell us.</p>

        <h2>Contact and corrections</h2>
        <p>
          Found something wrong or out of date? <ExternalLink href={`${industryData.site.githubRepo}/issues/new`}>Open an issue on GitHub</ExternalLink>. Every guide also has a &quot;Spot outdated info?&quot; link at the bottom.
        </p>
      </div>
    </article>
  );
}
