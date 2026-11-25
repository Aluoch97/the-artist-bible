import { Link } from 'react-router-dom';
import { ToolHeader } from '../components/ui/ToolHeader';

export function PrivacyPage() {
  return (
    <article>
      <ToolHeader title="Privacy policy" description="What The Artist Bible stores, what it never collects, and the one optional feature that sends text away." />
      <p className="-mt-3 mb-6 text-sm text-muted">Last updated: November 25, 2026</p>

      <div className="chapter-prose prose max-w-none">
        <ul>
          <li><strong>No accounts, no ads, no tracking.</strong> The app has no analytics, no advertising, no cookies and no third-party scripts or fonts.</li>
          <li><strong>What you type stays on your device.</strong> Checklists, release plans, saved releases, saved songs and split-sheet drafts (including names and PRO/IPI numbers you enter) are saved in your browser&apos;s local storage. We never receive them.</li>
          <li><strong>Theme and offline copy.</strong> Your dark or light choice is saved in your browser&apos;s local storage, separately from your work. If you use the app offline or install it, your browser also keeps a copy of the app&apos;s own files on your device. Neither contains anything you typed, and we never receive them.</li>
          <li><strong>Contract check.</strong> Files you add are read on your device and kept in memory only. The instant check never sends anything. The one exception is the <em>optional</em> AI review: if you choose it and agree, the contract text (with emails, phone numbers and long ID numbers removed if you leave that option on) is sent to Cloudflare Workers AI to write the review. Cloudflare states that it does not use that content to train its models and does not keep inputs or outputs after it replies. This app does not store the text. To enforce daily limits it keeps only two counters: a daily total, and a scrambled (hashed) form of your network address that expires after a day.</li>
          <li><strong>Backups are yours.</strong> The backup file you download contains everything you entered. Store it somewhere you trust, and share it only with people you intend to.</li>
          <li><strong>Hosting.</strong> The site is served by Cloudflare. Like any web host, it may keep standard server logs (for example IP address and pages requested) for security and operations. The app itself does not read or use them.</li>
          <li><strong>Links out.</strong> Links to other sites (PROs, The MLC, SoundExchange, streaming platforms, GitHub) open in a new tab. Those sites have their own privacy policies. The &quot;Spot outdated info?&quot; and &quot;Report a problem&quot; links open a pre-filled GitHub issue that only contains what you see there; nothing is sent unless you submit it.</li>
          <li><strong>Erasing your data.</strong> Use the backup button (top right) and choose &quot;Erase local data&quot; to clear everything you entered (your theme choice stays). To remove the theme choice and the offline copy too, clear this site&apos;s data in your browser settings.</li>
        </ul>
        <p>Questions about privacy? See <Link to="/about#contact">how to reach us</Link>. The rules for using the app are in the <Link to="/terms">Terms of use</Link>.</p>
      </div>
    </article>
  );
}
