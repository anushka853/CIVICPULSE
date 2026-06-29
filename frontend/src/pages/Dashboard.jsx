import React, { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle, 
  MapPin, 
  Flame, 
  Activity, 
  TrendingUp,
  Clock,
  ArrowRight,
  Play,
  Trophy,
  Award,
  Sparkles,
  Star,
  Zap,
  Trash2,
  Droplets,
  Lightbulb,
  ShieldAlert
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS elements
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const isVideoFile = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const Dashboard = () => {
  const { issues, fetchIssues, analytics, fetchAnalytics, user, activities, fetchActivities } = useContext(GlobalContext);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'impact'

  useEffect(() => {
    fetchIssues({ category: filterCategory, status: filterStatus });
    fetchAnalytics();
    fetchActivities();
  }, [filterCategory, filterStatus]);

  // Periodic polling interval for live updates (10 seconds)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchIssues({ category: filterCategory, status: filterStatus });
      fetchAnalytics();
      fetchActivities();
    }, 10000);
    return () => clearInterval(pollInterval);
  }, [filterCategory, filterStatus]);

  // Dynamic Impact Metrics
  const resolvedIssuesList = issues.filter(i => i.status === 'Resolved');
  const wasteCount = resolvedIssuesList.filter(i => i.category === 'Waste Management').length;
  const potholeCount = resolvedIssuesList.filter(i => i.category === 'Potholes & Roads').length;
  const waterCount = resolvedIssuesList.filter(i => i.category === 'Water Leakage').length;
  const streetlightCount = resolvedIssuesList.filter(i => i.category === 'Damaged Streetlights').length;

  const estimatedWasteCleared = wasteCount * 60; // 60 kg per cleanup average
  const estimatedWaterSaved = waterCount * 250; // 250 L per leak average
  const milestoneProgress = Math.min((resolvedIssuesList.length / 10) * 100, 100);

  // Setup data for Doughnut Category Chart
  const doughnutData = {
    labels: analytics?.categoryStats?.map(c => c._id) || [],
    datasets: [
      {
        data: analytics?.categoryStats?.map(c => c.count) || [],
        backgroundColor: [
          '#ef4444', // Red
          '#f59e0b', // Amber
          '#10b981', // Green
          '#0ea5e9', // Blue
          '#6366f1', // Indigo
          '#8b5cf6', // Violet
        ],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    ],
  };

  // Setup data for Bar Status Chart
  const barData = {
    labels: analytics?.statusStats?.map(s => s._id) || [],
    datasets: [
      {
        label: 'Issues Count',
        data: analytics?.statusStats?.map(s => s.count) || [],
        backgroundColor: 'rgba(14, 165, 233, 0.5)',
        borderColor: 'var(--color-primary)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 10 } },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', precision: 0 } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#94a3b8', font: { size: 10 } },
      },
    },
  };

  return (
    <div>
      <Navbar title="Dashboard Insights" />
      
      <div className="fade-in" style={{ marginTop: '1rem' }}>
        
        {/* Analytics Highlights */}
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '12px', color: 'var(--color-danger)' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Reported Issues</span>
              <h3 style={{ fontSize: '1.8rem', color: '#fff' }}>{analytics?.summary?.totalIssues || 0}</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: 'var(--color-secondary)' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Resolved by Authorities</span>
              <h3 style={{ fontSize: '1.8rem', color: '#fff' }}>{analytics?.summary?.resolvedIssues || 0}</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.15)', borderRadius: '12px', color: 'var(--color-primary)' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>AI-Verified Resolution Rate</span>
              <h3 style={{ fontSize: '1.8rem', color: '#fff' }}>{analytics?.summary?.resolutionRate || 0}%</h3>
            </div>
          </div>
        </div>

        {/* Premium Tab Selection */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <button 
            onClick={() => setActiveTab('live')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'live' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '1rem',
              fontWeight: 'bold',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'live' ? '3px solid var(--color-primary)' : 'none',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Live Map & Issues
          </button>
          <button 
            onClick={() => setActiveTab('impact')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'impact' ? 'var(--color-primary)' : 'var(--text-muted)',
              fontSize: '1rem',
              fontWeight: 'bold',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'impact' ? '3px solid var(--color-primary)' : 'none',
              transition: 'all 0.2s ease',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Community Impact & Quests
          </button>
        </div>

        {activeTab === 'live' ? (
          <>
            {/* Filters */}
            <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter Community Map:</span>
              
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)} 
                className="form-control" 
                style={{ width: 'auto', minWidth: '180px', padding: '0.5rem 1rem' }}
              >
                <option value="">All Categories</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Potholes & Roads">Potholes & Roads</option>
                <option value="Water Leakage">Water Leakage</option>
                <option value="Damaged Streetlights">Damaged Streetlights</option>
                <option value="Public Infrastructure">Public Infrastructure</option>
                <option value="Other">Other</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)} 
                className="form-control" 
                style={{ width: 'auto', minWidth: '150px', padding: '0.5rem 1rem' }}
              >
                <option value="">All Statuses</option>
                <option value="Reported">Reported</option>
                <option value="Verified">Verified</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            {/* Map & Chart Visualizations */}
            <div className="grid-2" style={{ marginBottom: '2rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={18} color="var(--color-primary)" />
                  <span>Live Issues & AI Hotspots Map</span>
                </h3>
                <MapComponent 
                  issues={issues} 
                  hotspots={analytics?.predictiveHotspots || []} 
                  zoom={12} 
                />
              </div>

              {/* Live activity feed & updates log */}
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} color="var(--color-primary)" className="animate-pulse" />
                  <span>Live City Activity Feed</span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Real-time status logs of citizen reports, verifications, and resolutions across the municipality.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '310px' }}>
                  {activities && activities.map((act) => (
                    <div key={act._id || act.id} style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: act.type === 'report' ? 'var(--color-primary)' : act.type === 'resolve' ? 'var(--color-secondary)' : 'var(--color-warning)'
                        }}></span>
                        <span style={{ color: '#fff' }}>{act.text}</span>
                      </div>
                      <span style={{ color: 'var(--text-dark)', fontSize: '0.7rem', flexShrink: 0 }}>
                        {act.createdAt ? new Date(act.createdAt).toLocaleTimeString() : (act.time || 'Just now')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Algorithmic Hotspots & Predictive Insights */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={18} color="var(--color-danger)" />
                <span>AI Predictive Maintenance Hotspots</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                This algorithmic engine flags areas where multiple community issues have accumulated in high density. 
                Municipal authorities should prioritize these coordinates to optimize city resources.
              </p>

              {analytics?.predictiveHotspots && analytics.predictiveHotspots.length > 0 ? (
                <div className="grid-3">
                  {analytics.predictiveHotspots.slice(0, 3).map((hotspot, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          color: 'var(--color-danger)', 
                          padding: '2px 8px', 
                          borderRadius: '10px',
                          fontWeight: 600
                        }}>
                          {hotspot.riskLevel}
                        </span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Activity size={12} />
                          {hotspot.count} Reports
                        </span>
                      </div>
                      <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Hotspot Coordinate Center</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>Lat: {hotspot.latitude.toFixed(5)}, Lng: {hotspot.longitude.toFixed(5)}</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                        Dominant: <strong style={{ color: '#fff' }}>{hotspot.dominantCategory}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', color: 'var(--text-dark)', textAlign: 'center', fontSize: '0.9rem' }}>
                  No critical geographic hotspots detected. Excellent city maintenance status!
                </div>
              )}
            </div>

            {/* Recent Reports Listing */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="var(--color-secondary)" />
                  <span>Recent Civic Reports Feed</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Showing {issues.length} active updates</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {issues.slice(0, 5).map((issue) => (
                  <div 
                    key={issue._id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '1rem', 
                      display: 'flex', 
                      gap: '1rem', 
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.03)'
                    }}
                  >
                    {isVideoFile(issue.image) ? (
                      <div style={{ position: 'relative', width: '80px', height: '80px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                        <video 
                          src={issue.image.startsWith('/') ? `http://localhost:5000${issue.image}` : issue.image} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          <Play size={16} fill="white" />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={issue.image.startsWith('/') ? `http://localhost:5000${issue.image}` : issue.image} 
                        alt={issue.title} 
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)', flexShrink: 0 }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1594818868299-19c22221b0f3?auto=format&fit=crop&q=60&w=150';
                        }}
                      />
                    )}
                    
                    <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <h4 style={{ fontSize: '1rem', color: '#fff', marginRight: '0.5rem', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {issue.title}
                        </h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>•</span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          background: issue.status === 'Resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: issue.status === 'Resolved' ? 'var(--color-secondary)' : 'var(--color-warning)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 600
                        }}>
                          {issue.status}
                        </span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          color: 'var(--color-danger)', 
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontWeight: 600
                        }}>
                          {issue.severity}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {issue.description}
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                        <span>By: <strong style={{ color: 'var(--text-muted)' }}>{issue.reporter?.name || 'Anonymous'}</strong></span>
                        <span>•</span>
                        <span>Votes: <strong style={{ color: 'var(--text-muted)' }}>{issue.upvotes?.length || 0}</strong></span>
                        <span>•</span>
                        <span>Category: <strong style={{ color: 'var(--text-muted)' }}>{issue.category}</strong></span>
                      </div>
                    </div>

                    <div>
                      <Link 
                        to={`/issues/${issue._id}`} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', height: 'auto', borderRadius: '8px' }}
                      >
                        <span>View</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}

                {issues.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dark)' }}>
                    No active issues reported. Click 'Report Issue' to submit one!
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Impact Analytics & Gamification Tab */
          <div className="grid-2">
            
            {/* Dynamic Community Impact counters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy color="var(--color-warning)" />
                  <span>City-Wide Civic Impact Statistics</span>
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'rgba(245,158,11,0.1)', color: 'var(--color-warning)', borderRadius: '8px' }}>
                        <Trash2 size={20} />
                      </div>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block' }}>Waste Handled</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Garbage & litter resolved</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-warning)' }}>{estimatedWasteCleared} kg</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dark)' }}>{wasteCount} cleanup actions</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'rgba(14,165,233,0.1)', color: 'var(--color-primary)', borderRadius: '8px' }}>
                        <Droplets size={20} />
                      </div>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block' }}>Drinking Water Saved</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolved leakages & pooling</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{estimatedWaterSaved} Litres</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dark)' }}>{waterCount} repairs completed</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.1)', color: 'var(--color-secondary)', borderRadius: '8px' }}>
                        <Zap size={20} />
                      </div>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block' }}>Potholes Patched</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roads restored to safety</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{potholeCount} Patched</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dark)' }}>Road maintenance verified</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'rgba(99,102,241,0.1)', color: 'var(--color-info)', borderRadius: '8px' }}>
                        <Lightbulb size={20} />
                      </div>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.9rem', display: 'block' }}>Safe Light Zones</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Streetlights and bulb fixes</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-info)' }}>{streetlightCount} Restored</span>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-dark)' }}>Pedestrian paths lighted</span>
                    </div>
                  </div>

                </div>

                {/* Milestone Progress Bar */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Clean City Level 3 Milestone</span>
                    <strong style={{ color: 'var(--color-secondary)' }}>{resolvedIssuesList.length}/10 Resolved Issues</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${milestoneProgress}%`, height: '100%', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }} />
                  </div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '5px', textAlign: 'center' }}>
                    Get {10 - Math.min(resolvedIssuesList.length, 10)} more issues resolved to unlock City Hero award!
                  </span>
                </div>

              </div>

              {/* Citizen Quest card (Gamified) */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award color="var(--color-primary)" />
                  <span>Citizen Patrol Quests</span>
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '10px', background: user?.reportedCount >= 1 ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#fff' }}>1. City Scout (Report 1 issue)</strong>
                      <span style={{ fontSize: '0.75rem', color: user?.reportedCount >= 1 ? 'var(--color-secondary)' : 'var(--color-warning)', fontWeight: 'bold' }}>
                        {user?.reportedCount >= 1 ? 'COMPLETED (+10 XP)' : 'IN PROGRESS (0/1)'}
                      </span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: user?.reportedCount >= 1 ? '100%' : '0%', height: '100%', background: 'var(--color-secondary)' }} />
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '10px', background: user?.verifiedCount >= 3 ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#fff' }}>2. Consensus Builder (Verify 3 reports)</strong>
                      <span style={{ fontSize: '0.75rem', color: user?.verifiedCount >= 3 ? 'var(--color-secondary)' : 'var(--color-warning)', fontWeight: 'bold' }}>
                        {user?.verifiedCount >= 3 ? 'COMPLETED (+6 XP)' : `IN PROGRESS (${Math.min(user?.verifiedCount || 0, 3)}/3)`}
                      </span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(((user?.verifiedCount || 0) / 3) * 100, 100)}%`, height: '100%', background: 'var(--color-secondary)' }} />
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '10px', background: user?.level >= 3 ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#fff' }}>3. Elite Inspector (Reach Level 3)</strong>
                      <span style={{ fontSize: '0.75rem', color: user?.level >= 3 ? 'var(--color-secondary)' : 'var(--color-warning)', fontWeight: 'bold' }}>
                        {user?.level >= 3 ? 'COMPLETED (+25 XP)' : `IN PROGRESS (Lvl ${user?.level}/3)`}
                      </span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: user?.level >= 3 ? '100%' : `${Math.min(((user?.level || 1) / 3) * 100, 100)}%`, height: '100%', background: 'var(--color-secondary)' }} />
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Charts Visualizations Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Issues by Category</h3>
                <div style={{ height: '180px', display: 'flex', justifyContent: 'center' }}>
                  {analytics?.categoryStats?.length > 0 ? (
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  ) : (
                    <span style={{ color: 'var(--text-dark)', fontSize: '0.9rem' }}>No data loaded</span>
                  )}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Resolution Progression</h3>
                <div style={{ height: '150px' }}>
                  {analytics?.statusStats?.length > 0 ? (
                    <Bar data={barData} options={chartOptions} />
                  ) : (
                    <span style={{ color: 'var(--text-dark)', fontSize: '0.9rem' }}>No data loaded</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      <style>{`
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .5; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
