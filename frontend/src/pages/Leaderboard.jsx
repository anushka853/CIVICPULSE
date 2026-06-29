import React, { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import Navbar from '../components/Navbar';
import { Trophy, Award, Star, Flame, Sparkles, AlertCircle } from 'lucide-react';

const Leaderboard = () => {
  const { getLeaderboard } = useContext(GlobalContext);
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const board = await getLeaderboard();
        setCitizens(board);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, []);

  const badgeDescriptions = {
    'Spotter': { desc: 'Reported your first community issue.', icon: <Star size={16} /> },
    'Civic Guard': { desc: 'Reported 5 or more valid community issues.', icon: <Flame size={16} /> },
    'Trustworthy Verifier': { desc: 'Verified/upvoted 5 or more reports.', icon: <Award size={16} /> },
    'City Hero': { desc: 'Accumulated over 200 XP points.', icon: <Sparkles size={16} /> }
  };

  return (
    <div>
      <Navbar title="Civic Leaderboard" />

      <div className="fade-in" style={{ marginTop: '1rem' }}>
        
        <div className="grid-2">
          
          {/* Left panel: Top Ranks Table */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy color="var(--color-warning)" />
              <span>Top Citizen Patrol Rankings</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Citizens are ranked based on their total XP points. Earn XP by reporting community issues (+10 XP) and verifying other citizens' reports (+2 XP).
            </p>

            {loading ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>Loading leaderboard standings...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                
                {citizens.map((citizen, index) => (
                  <div 
                    key={citizen._id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.85rem 1rem',
                      background: index === 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${index === 0 ? 'rgba(245, 158, 11, 0.2)' : 'var(--border-color)'}`,
                      borderRadius: '12px',
                      gap: '1rem'
                    }}
                  >
                    {/* Rank Number */}
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: index === 0 ? 'var(--color-warning)' : index === 1 ? '#cbd5e1' : index === 2 ? '#b45309' : 'rgba(255,255,255,0.05)',
                      color: index === 0 ? '#000' : index === 1 ? '#000' : index === 2 ? '#fff' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem'
                    }}>
                      {index + 1}
                    </div>

                    {/* Citizen Name & Level */}
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>{citizen.name}</h4>
                      <span className="level-pill" style={{ fontSize: '0.6rem', padding: '1px 6px', marginTop: '2px', display: 'inline-block' }}>
                        LVL {citizen.level}
                      </span>
                    </div>

                    {/* XP details */}
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary)' }}>{citizen.points} XP</strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dark)' }}>{citizen.reportedCount || 0} Reports</span>
                    </div>

                  </div>
                ))}

                {citizens.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dark)' }}>
                    No citizens ranked yet. Start reporting to earn XP!
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Right panel: Badges Guide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Gamification Points Rules */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={18} color="var(--color-primary)" />
                <span>Points System Rules</span>
              </h3>
              
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                  <span>Report a new community issue</span>
                  <strong style={{ color: 'var(--color-secondary)' }}>+10 XP</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                  <span>Verify another citizen's report</span>
                  <strong style={{ color: 'var(--color-secondary)' }}>+2 XP</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                  <span>Your report is officially resolved</span>
                  <strong style={{ color: 'var(--color-secondary)' }}>+50 XP</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                  <span>Upvoted reports you verified get resolved</span>
                  <strong style={{ color: 'var(--color-secondary)' }}>+10 XP</strong>
                </li>
              </ul>
            </div>

            {/* Badges explanation list */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.25rem' }}>Community Achievement Badges</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.keys(badgeDescriptions).map((badgeName) => {
                  const details = badgeDescriptions[badgeName];
                  return (
                    <div key={badgeName} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: 'var(--color-secondary)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {details.icon}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#fff', display: 'block' }}>{badgeName}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{details.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Leaderboard;
