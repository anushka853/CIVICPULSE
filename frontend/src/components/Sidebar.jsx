import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GlobalContext } from '../context/GlobalContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Trophy, 
  ShieldAlert, 
  LogOut, 
  Award,
  User as UserIcon,
  Bell,
  X,
  Briefcase
} from 'lucide-react';

const Sidebar = () => {
  const { 
    user, 
    logout, 
    activities, 
    fetchActivities, 
    mobileSidebarOpen, 
    setMobileSidebarOpen 
  } = useContext(GlobalContext);

  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Poll for activities when notifications panel is open or periodically
  useEffect(() => {
    if (user) {
      fetchActivities();
      const interval = setInterval(() => {
        fetchActivities();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleOpenNotifications = () => {
    fetchActivities();
    setShowNotifications(true);
  };

  const handleLinkClick = () => {
    setMobileSidebarOpen(false);
  };

  // Calculate percentage to next level (each level is 50 XP)
  const currentLevelXp = user ? user.points % 50 : 0;
  const xpPercent = Math.min((currentLevelXp / 50) * 100, 100);

  return (
    <>
      {/* Mobile Drawer backdrop overlay */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="mobile-sidebar-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000
          }}
        />
      )}

      <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="logo-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="logo-icon">C</div>
            <h1 className="logo-text">CivicPulse</h1>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {user && (
              <button 
                onClick={handleOpenNotifications}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-color)',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                title="Notifications"
              >
                <Bell size={16} />
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--color-danger)',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%'
                }}></span>
              </button>
            )}

            {/* Mobile close sidebar button */}
            <button
              className="mobile-close-btn"
              onClick={() => setMobileSidebarOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.5rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'none', // Overridden in media query
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {user ? (
          <ul className="nav-links">
            <li className={`nav-item ${isActive('/') ? 'active' : ''}`} onClick={handleLinkClick}>
              <Link to="/">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </li>
            
            {user.role === 'Citizen' && (
              <li className={`nav-item ${isActive('/report') ? 'active' : ''}`} onClick={handleLinkClick}>
                <Link to="/report">
                  <PlusCircle />
                  <span>Report Issue</span>
                </Link>
              </li>
            )}

            {user.role === 'Staff' && (
              <li className={`nav-item ${isActive('/staff') ? 'active' : ''}`} onClick={handleLinkClick}>
                <Link to="/staff">
                  <Briefcase size={20} />
                  <span>Staff Portal</span>
                </Link>
              </li>
            )}

            {user.role === 'Admin' && (
              <li className={`nav-item ${isActive('/admin') ? 'active' : ''}`} onClick={handleLinkClick}>
                <Link to="/admin">
                  <ShieldAlert />
                  <span>Authority Portal</span>
                </Link>
              </li>
            )}

            <li className={`nav-item ${isActive('/leaderboard') ? 'active' : ''}`} onClick={handleLinkClick}>
              <Link to="/leaderboard">
                <Trophy />
                <span>Leaderboard</span>
              </Link>
            </li>
          </ul>
        ) : (
          <div style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>
            Please sign in to access details.
          </div>
        )}

        {user && (
          <div className="user-sidebar-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <UserIcon size={18} color="var(--color-primary)" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {user.name}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  {user.role === 'Staff' ? 'Working Staff' : user.role}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginTop: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{user.points} XP</span>
              <span className="level-pill">LVL {user.level}</span>
            </div>

            <div className="xp-bar">
              <div className="xp-progress" style={{ width: `${xpPercent}%` }}></div>
            </div>

            {user.badges && user.badges.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.8rem' }}>
                {user.badges.slice(0, 3).map((badge) => (
                  <div key={badge} title={badge} style={{ 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'var(--color-secondary)',
                    fontSize: '0.65rem',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <Award size={10} />
                    <span>{badge}</span>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => {
                logout();
                handleLinkClick();
              }} 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '0.5rem', marginTop: '1rem', fontSize: '0.8rem', height: 'auto', borderRadius: '8px' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Slide-out Notification Panel Overlay */}
      {showNotifications && (
        <div 
          onClick={() => setShowNotifications(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9998,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}
      <div style={{
        position: 'fixed',
        top: 0,
        right: showNotifications ? 0 : '-360px',
        width: '360px',
        height: '100vh',
        background: 'radial-gradient(circle at center, #111827 0%, #090d16 100%)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        zIndex: 9999,
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} color="var(--color-primary)" />
            <span>Alerts & Notifications</span>
          </h3>
          <button 
            onClick={() => setShowNotifications(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activities && activities.length > 0 ? (
            activities.map((act) => (
              <div 
                key={act._id} 
                style={{
                  padding: '0.85rem',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  lineHeight: '1.4'
                }}
              >
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: act.type === 'report' ? 'var(--color-primary)' : act.type === 'resolve' ? 'var(--color-secondary)' : '#8b5cf6',
                    marginTop: '6px',
                    flexShrink: 0
                  }}/>
                  <div style={{ flexGrow: 1 }}>
                    <span style={{ color: '#fff', display: 'block' }}>{act.text}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', display: 'block', marginTop: '4px' }}>
                      {new Date(act.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-dark)', padding: '2rem' }}>
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
