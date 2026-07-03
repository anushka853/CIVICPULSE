import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GlobalContext } from './context/GlobalContext';

// Components
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import IssueDetails from './pages/IssueDetails';
import Leaderboard from './pages/Leaderboard';
import AuthorityPortal from './pages/AuthorityPortal';
import StaffPortal from './pages/StaffPortal';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireAdmin = false, requireRole = null }) => {
  const { user } = useContext(GlobalContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { user, toast, setToast } = useContext(GlobalContext);
  const location = useLocation();

  // Don't render sidebar/header layout on the Login page
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${
            toast.type === 'success' 
              ? 'rgba(16, 185, 129, 0.4)' 
              : toast.type === 'error' 
                ? 'rgba(239, 68, 68, 0.4)' 
                : toast.type === 'warning' 
                  ? 'rgba(245, 158, 11, 0.4)' 
                  : 'rgba(14, 165, 233, 0.4)'
          }`,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          color: '#fff',
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          maxWidth: '350px',
          animation: 'slide-in 0.3s ease forwards'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 
              toast.type === 'success' 
                ? 'var(--color-secondary)' 
                : toast.type === 'error' 
                  ? 'var(--color-danger)' 
                  : toast.type === 'warning' 
                    ? 'var(--color-warning)' 
                    : 'var(--color-primary)',
            boxShadow: `0 0 10px ${
              toast.type === 'success' 
                ? 'var(--color-secondary)' 
                : toast.type === 'error' 
                  ? 'var(--color-danger)' 
                  : toast.type === 'warning' 
                    ? 'var(--color-warning)' 
                    : 'var(--color-primary)'
            }`
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, flexGrow: 1 }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '1.2rem',
              lineHeight: 1,
              padding: '0 4px',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.color = '#fff'}
            onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            ×
          </button>
        </div>
      )}
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report" 
            element={
              <ProtectedRoute requireRole="Citizen">
                <ReportIssue />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/issues/:id" 
            element={
              <ProtectedRoute>
                <IssueDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/leaderboard" 
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/staff" 
            element={
              <ProtectedRoute requireRole="Staff">
                <StaffPortal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AuthorityPortal />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
