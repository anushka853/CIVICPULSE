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
  const { user } = useContext(GlobalContext);
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
