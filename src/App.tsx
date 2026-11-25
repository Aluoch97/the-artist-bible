import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { RouteMeta } from './components/layout/RouteMeta';
import { HomeTriageHero } from './components/triage/HomeTriageHero';
import { ReleaseCalculator } from './components/tools/ReleaseCalculator';
import { RoyaltyAudit } from './components/tools/RoyaltyAudit';
import { MySongs } from './components/tools/MySongs';
import { ShowLog } from './components/tools/ShowLog';
import { EpkBuilder } from './components/tools/EpkBuilder';
import { ReleaseBudget } from './components/tools/ReleaseBudget';
import { StreamingCalculator } from './components/tools/StreamingCalculator';
import { SplitSheetBuilder } from './components/tools/SplitSheetBuilder';
import { ChapterPage } from './pages/ChapterPage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AdminPage } from './pages/AdminPage';
import { ToolsPage } from './pages/ToolsPage';
import { LearnPage } from './pages/LearnPage';
import { NotFound } from './pages/NotFound';

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
        <Route path="/contract" element={<LearnPage section="contract" />} />
        <Route path="/words" element={<LearnPage section="words" />} />
        <Route path="/guides/:slug" element={<ChapterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
    </AppShell>
  );
}
