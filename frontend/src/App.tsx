import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { ResearchProvider } from './context/ResearchContext'

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const TrendsPage = lazy(() => import('./pages/TrendsPage').then((module) => ({ default: module.TrendsPage })))

export default function App() {
  return (
    <BrowserRouter>
      <ResearchProvider>
        <MainLayout>
          <Suspense fallback={<div role="status" className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">Cargando esta sección…</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/variables" element={<Navigate to="/dashboard" replace />} />
              <Route path="/geography" element={<Navigate to="/dashboard" replace />} />
              <Route path="/sources" element={<Navigate to="/dashboard" replace />} />
              <Route path="/time-series" element={<Navigate to="/dashboard" replace />} />
              <Route path="/trends" element={<TrendsPage />} />
              <Route path="/results" element={<Navigate to="/trends" replace />} />
              <Route path="/history" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </MainLayout>
      </ResearchProvider>
    </BrowserRouter>
  )
}
