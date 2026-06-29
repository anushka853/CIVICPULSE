import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GlobalContext } from '../context/GlobalContext';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { 
  ThumbsUp, 
  ThumbsDown, 
  User as UserIcon, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  CheckCircle,
  Clock,
  ArrowLeft,
  Activity,
  AlertTriangle
} from 'lucide-react';

const isVideoFile = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const IssueDetails = () => {
  const { id } = useParams();
  const { fetchIssueById, verifyIssue, user } = useContext(GlobalContext);
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voteMessage, setVoteMessage] = useState('');

  const loadIssue = async () => {
    try {
      setLoading(true);
      const data = await fetchIssueById(id);
      setIssue(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssue();
  }, [id]);

  const handleVote = async (action) => {
    if (!user) {
      return setVoteMessage('Please sign in to verify reports');
    }
    setVoteMessage('');
    try {
      const updated = await verifyIssue(id, action);
      setIssue(updated);
      setVoteMessage(`Successfully registered your ${action === 'upvote' ? 'verification' : 'spam flag'}! (+2 XP)`);
    } catch (err) {
      setVoteMessage(err.message || 'Verification failed');
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar title="Issue Progress Details" />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading details...
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div>
        <Navbar title="Issue Progress Details" />
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', margin: '2rem' }}>
          <AlertTriangle color="var(--color-danger)" size={32} style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#fff', marginBottom: '1rem' }}>{error || 'Issue not found'}</h3>
          <Link to="/" className="btn btn-secondary">
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // Active user checking
  const isReporter = user && issue.reporter?._id === user._id;
  const hasUpvoted = user && issue.upvotes.includes(user._id);
  const hasDownvoted = user && issue.downvotes.includes(user._id);

  // Workflow steps: 1 = Reported, 2 = Verified, 3 = In Progress, 4 = Resolved
  let workflowStep = 1;
  if (issue.status === 'Verified') workflowStep = 2;
  if (issue.status === 'In Progress') workflowStep = 3;
  if (issue.status === 'Resolved') workflowStep = 4;

  const imageUrl = issue.image.startsWith('/') ? `http://localhost:5000${issue.image}` : issue.image;
  const resolutionImageUrl = issue.resolutionImage?.startsWith('/') ? `http://localhost:5000${issue.resolutionImage}` : issue.resolutionImage;

  return (
    <div>
      <Navbar title="Issue Tracking Details" />

      <div className="fade-in" style={{ marginTop: '1rem' }}>
        
        {/* Back navigation */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        {/* Workflow tracker banner */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>Resolution Progression Status</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: workflowStep >= 1 ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                color: workflowStep >= 1 ? '#000' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem'
              }}>1</div>
              <span style={{ fontSize: '0.9rem', color: workflowStep >= 1 ? '#fff' : 'var(--text-muted)', fontWeight: workflowStep === 1 ? 'bold' : 'normal' }}>Reported</span>
            </div>

            <div style={{ flexGrow: 1, height: '2px', background: workflowStep >= 2 ? 'var(--color-primary)' : 'var(--border-color)' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: workflowStep >= 2 ? 'var(--color-warning)' : 'rgba(255,255,255,0.05)',
                color: workflowStep >= 2 ? '#000' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem'
              }}>2</div>
              <span style={{ fontSize: '0.9rem', color: workflowStep >= 2 ? '#fff' : 'var(--text-muted)', fontWeight: workflowStep === 2 ? 'bold' : 'normal' }}>Verified</span>
            </div>

            <div style={{ flexGrow: 1, height: '2px', background: workflowStep >= 3 ? 'var(--color-primary)' : 'var(--border-color)' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: workflowStep >= 3 ? 'var(--color-info)' : 'rgba(255,255,255,0.05)',
                color: workflowStep >= 3 ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem'
              }}>3</div>
              <span style={{ fontSize: '0.9rem', color: workflowStep >= 3 ? '#fff' : 'var(--text-muted)', fontWeight: workflowStep === 3 ? 'bold' : 'normal' }}>In Progress</span>
            </div>

            <div style={{ flexGrow: 1, height: '2px', background: workflowStep >= 4 ? 'var(--color-primary)' : 'var(--border-color)' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: workflowStep >= 4 ? 'var(--color-secondary)' : 'rgba(255,255,255,0.05)',
                color: workflowStep >= 4 ? '#000' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem'
              }}>4</div>
              <span style={{ fontSize: '0.9rem', color: workflowStep >= 4 ? '#fff' : 'var(--text-muted)', fontWeight: workflowStep === 4 ? 'bold' : 'normal' }}>Resolved</span>
            </div>

          </div>
        </div>

        {/* Major details layout */}
        <div className="grid-2" style={{ marginBottom: '2rem' }}>
          
          {/* Left panel: Info & Votes */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>{issue.category}</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: 'var(--color-danger)', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  fontWeight: 600 
                }}>{issue.severity} Severity</span>
              </div>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.5rem' }}>{issue.title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>{issue.description}</p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1rem 0', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserIcon size={16} />
                <span>Reporter: <strong>{issue.reporter?.name || 'Anonymous'} (Lvl {issue.reporter?.level})</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={16} />
                <span>Date: <strong>{new Date(issue.createdAt).toLocaleDateString()}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={16} />
                <span>Loc: <strong>{issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}</strong></span>
              </div>
            </div>

            {/* Voting & consensus system */}
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.5rem' }}>Community Verification Consensus</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                Citizens verify if reports are genuine. Reports reaching 3 net verifications are promoted to 'Verified' status.
              </p>

              {/* Consensus Progress Bar */}
              <div style={{ margin: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  <span>Consensus Strength</span>
                  <span style={{ fontWeight: 'bold', color: ((issue.upvotes?.length || 0) - (issue.downvotes?.length || 0)) >= 3 ? 'var(--color-secondary)' : 'var(--color-warning)' }}>
                    {((issue.upvotes?.length || 0) - (issue.downvotes?.length || 0))}/3 Net Verifications {((issue.upvotes?.length || 0) - (issue.downvotes?.length || 0)) >= 3 && '✓'}
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max(0, Math.min((((issue.upvotes?.length || 0) - (issue.downvotes?.length || 0)) / 3) * 100, 100))}%`,
                    background: ((issue.upvotes?.length || 0) - (issue.downvotes?.length || 0)) >= 3 ? 'linear-gradient(to right, var(--color-secondary), #059669)' : 'linear-gradient(to right, var(--color-warning), #d97706)',
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              {voteMessage && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                  {voteMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => handleVote('upvote')} 
                  className="btn btn-secondary" 
                  disabled={isReporter || hasUpvoted}
                  style={{ 
                    flex: 1, 
                    background: hasUpvoted ? 'rgba(16, 185, 129, 0.15)' : '', 
                    borderColor: hasUpvoted ? 'var(--color-secondary)' : '',
                    color: hasUpvoted ? 'var(--color-secondary)' : '' 
                  }}
                  title={isReporter ? 'You cannot verify your own report' : ''}
                >
                  <ThumbsUp size={16} />
                  <span>Verify ({issue.upvotes.length})</span>
                </button>

                <button 
                  onClick={() => handleVote('downvote')} 
                  className="btn btn-secondary"
                  disabled={isReporter || hasDownvoted}
                  style={{ 
                    flex: 1, 
                    background: hasDownvoted ? 'rgba(239, 68, 68, 0.15)' : '', 
                    borderColor: hasDownvoted ? 'var(--color-danger)' : '',
                    color: hasDownvoted ? 'var(--color-danger)' : '' 
                  }}
                  title={isReporter ? 'You cannot flag your own report' : ''}
                >
                  <ThumbsDown size={16} />
                  <span>Spam ({issue.downvotes.length})</span>
                </button>
              </div>
            </div>

            {/* AI Safety instructions */}
            {issue.safetySuggestions && (
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1rem', borderRadius: '12px', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <ShieldAlert size={18} color="var(--color-info)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-info)', display: 'block', marginBottom: '2px' }}>AI PUBLIC SAFETY ADVICE</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{issue.safetySuggestions}</p>
                </div>
              </div>
            )}

          </div>

          {/* Right panel: Images & Map coordinates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Original Media Card */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem' }}>Report Media Proof</h4>
              {isVideoFile(issue.image) ? (
                <video 
                  src={imageUrl} 
                  controls 
                  style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              ) : (
                <img 
                  src={imageUrl} 
                  alt="Reported civic issue" 
                  style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1594818868299-19c22221b0f3?auto=format&fit=crop&q=60&w=600';
                  }}
                />
              )}
            </div>

            {/* Map coordinates display */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem' }}>Pinpoint Location</h4>
              <MapComponent issues={[issue]} center={[issue.latitude, issue.longitude]} zoom={15} />
            </div>

          </div>

        </div>

        {/* Double-Blind Resolution verification portal display */}
        {issue.status === 'Resolved' && (
          <div className="glass-panel fade-in" style={{ padding: '2rem', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.03)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle />
                <span>Gemini AI Resolution Auditor Verdict</span>
              </h3>
              <span style={{ 
                fontSize: '0.85rem', 
                background: issue.aiResolutionConfidence >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: issue.aiResolutionConfidence >= 80 ? 'var(--color-secondary)' : 'var(--color-warning)',
                padding: '3px 10px', 
                borderRadius: '20px', 
                fontWeight: 800,
                border: `1px solid ${issue.aiResolutionConfidence >= 80 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
              }}>
                {issue.aiResolutionConfidence}% AI Match Confidence
              </span>
            </div>

            <div className="grid-2">
              <div>
                <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.5rem' }}>Resolution details</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                  {issue.aiResolutionDetails}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                  Resolved at: <strong>{new Date(issue.resolvedAt).toLocaleString()}</strong> by <strong>Municipal Admin</strong>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.5rem' }}>Before & After Comparison</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Original Issue</span>
                    {isVideoFile(issue.image) ? (
                      <video 
                        src={imageUrl} 
                        controls
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                      />
                    ) : (
                      <img 
                        src={imageUrl} 
                        alt="Before" 
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1594818868299-19c22221b0f3?auto=format&fit=crop&q=60&w=300'; }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Fixed Location</span>
                    {isVideoFile(issue.resolutionImage) ? (
                      <video 
                        src={resolutionImageUrl} 
                        controls
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                      />
                    ) : (
                      <img 
                        src={resolutionImageUrl} 
                        alt="After" 
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=60&w=300'; }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default IssueDetails;
