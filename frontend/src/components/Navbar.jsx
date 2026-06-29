import React, { useContext } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { ShieldCheck, User as UserIcon } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user } = useContext(GlobalContext);

  return (
    <header className="top-header">
      <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>{title || 'Dashboard'}</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px'
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Welcome, </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user.name}</span>
            {user.role === 'Admin' && (
              <span style={{ 
                color: 'var(--color-primary)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '2px',
                fontSize: '0.75rem',
                marginLeft: '0.25rem',
                background: 'rgba(14,165,233,0.1)',
                padding: '1px 6px',
                borderRadius: '10px',
                border: '1px solid rgba(14,165,233,0.2)'
              }}>
                <ShieldCheck size={12} />
                <span>Admin</span>
              </span>
            )}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            CivicPulse AI Portal
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
