import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { RouteMeta } from './components/layout/RouteMeta';
import { HomeTriageHero } from './components/triage/HomeTriageHero';
import { NotFound } from './pages/NotFound';

const ReleaseCalculator = lazy(() => import('./components/tools/ReleaseCalculator').then((m) => ({ default: m.ReleaseCalculator })));
const RoyaltyAudit = lazy(() => import('./components/tools/RoyaltyAudit').then((m) => ({ default: m.RoyaltyAudit })));
const MySongs = lazy(() => import('./components/tools/MySongs').then((m) => ({ default: m.MySongs })));
const ShowLog = lazy(() => import('./components/tools/ShowLog').then((m) => ({ default: m.ShowLog })));
const EpkBuilder = lazy(() => import('./components/tools/EpkBuilder').then((m) => ({ default: m.EpkBuilder })));
const ReleaseBudget = lazy(() => import('./components/tools/ReleaseBudget').then((m) => ({ default: m.ReleaseBudget })));
const StreamingCalculator = lazy(() => import('./components/tools/StreamingCalculator').then((m) => ({ default: m.StreamingCalculator })));
const SplitSheetBuilder = lazy(() => import('./components/tools/SplitSheetBuilder').then((m) => ({ default: m.SplitSheetBuilder })));
const ChapterPage = lazy(() => import('./pages/ChapterPage').then((m) => ({ default: m.ChapterPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const ToolsPage = lazy(() => import('./pages/ToolsPage').then((m) => ({ default: m.ToolsPage })));
const ContractPage = lazy(() => import('./pages/ContractPage').then((m) => ({ default: m.ContractPage })));
const LearnPage = lazy(() => import('./pages/LearnPage').then((m) => ({ default: m.LearnPage })));

// Every page except Home loads its code when it is first opened (all of it is also saved for offline use).
function RouteFallback() {
  return <div className="min-h-[calc(100dvh-4rem)]" role="status" aria-label="Loading" />;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Jump to a section like /about#install once the page has rendered.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <AppShell>
      <ScrollToTop />
      <RouteMeta />
      <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomeTriageHero />} />
        <Route path="/audit" element={<RoyaltyAudit />} />
        <Route path="/release" element={<ReleaseCalculator />} />
        <Route path="/split-sheet" element={<SplitSheetBuilder />} />
        <Route path="/songs" element={<MySongs />} />
        <Route path="/shows" element={<ShowLog />} />
        <Route path="/epk" element={<EpkBuilder />} />
        <Route path="/budget" element={<ReleaseBudget />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/streams" element={<StreamingCalculator />} />
        <Route path="/red-flags" element={<LearnPage section="red-flags" />} />
        <Route path="/guides" element={<LearnPage section="guides" />} />
        <Route path="/contract" element={<ContractPage />} />
        <Route path="/words" element={<LearnPage section="words" />} />
        <Route path="/guides/:slug" element={<ChapterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}
