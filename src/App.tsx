import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { HomeTriageHero } from './components/triage/HomeTriageHero';
import { RedFlagDecoder } from './components/tools/RedFlagDecoder';
import { ReleaseCalculator } from './components/tools/ReleaseCalculator';
import { RoyaltyAudit } from './components/tools/RoyaltyAudit';
import { SplitSheetBuilder } from './components/tools/SplitSheetBuilder';
import { ChapterPage } from './pages/ChapterPage';
import { GuidesIndex } from './pages/GuidesIndex';
import { NotFound } from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppShell>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomeTriageHero />} />
        <Route path="/audit" element={<RoyaltyAudit />} />
        <Route path="/release" element={<ReleaseCalculator />} />
        <Route path="/split-sheet" element={<SplitSheetBuilder />} />
        <Route path="/red-flags" element={<RedFlagDecoder />} />
        <Route path="/guides" element={<GuidesIndex />} />
        <Route path="/guides/:slug" element={<ChapterPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}
