import { Share, SquarePlus, X } from 'lucide-react';
import { useInstallContext } from '../../hooks/useInstallContext';
import { Link } from 'react-router-dom';

/** iPhone has no install button, so say how to do it. Hidden once installed or dismissed. */
export function IosInstallTip() {
  const { showIosTip, dismissIosTip } = useInstallContext();
  if (!showIosTip) return null;
  return (
    <aside aria-label="Add to Home Screen" className="no-print relative mb-6 rounded-2xl border border-gold/40 bg-gold/10 p-4 pr-12">
      <button type="button" onClick={dismissIosTip} aria-label="Hide this tip" className="absolute right-1 top-1 grid h-11 w-11 cursor-pointer place-items-center rounded-full text-muted hover:text-fg">
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      <p className="font-bold text-gold">Put it on your Home Screen</p>
      <ol className="mt-2 space-y-1.5 text-[15px]">
        <li className="flex items-start gap-2.5"><Share className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" /><span>Tap the <strong>Share</strong> button in your browser.</span></li>
        <li className="flex items-start gap-2.5"><SquarePlus className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" /><span>Choose <strong>Add to Home Screen</strong>.</span></li>
      </ol>
      <p className="mt-2 text-sm text-muted">It opens full screen, works offline, and your saved work is safest there. Browsers can clear saved data for sites you don&apos;t install. <Link to="/about#install" className="font-semibold text-fg underline underline-offset-4">More help</Link></p>
    </aside>
  );
}
