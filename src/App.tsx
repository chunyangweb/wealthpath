import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { HomePage } from '@/routes/HomePage';
import { InputsPage } from '@/routes/InputsPage';
import { AllocationPage } from '@/routes/AllocationPage';
import { SimulationPage } from '@/routes/SimulationPage';
import { SummaryPage } from '@/routes/SummaryPage';

/**
 * HashRouter is intentional for GitHub Pages: there's no server-side rewrite,
 * so deep links like /inputs would 404 with BrowserRouter. Hash routing keeps
 * the URL on the same index.html.
 *
 * All routes share the AppShell (sidebar + top bar), so the visual frame is
 * consistent across the entire app.
 */
function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/inputs" element={<InputsPage />} />
          <Route path="/allocation" element={<AllocationPage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/summary" element={<SummaryPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
