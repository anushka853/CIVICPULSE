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
  AlertTriangle,
  ZoomIn,
  Check
} from 'lucide-react';

const isVideoFile = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const IssueDetails = () => {
  const { id } = useParams();
  const { fetchIssueById, verifyIssue, user, getBackendUrl } = useContext(GlobalContext);
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voteMessage, setVoteMessage] = useState('');
  const [zoomImage, setZoomImage] = useState(null);

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

  // Workflow steps: 1 = Reported, 2 = Verified, 3 = In Progress, 4 = Completed, 5 = Resolved
  let workflowStep = 1;
  if (issue.status === 'Verified') workflowStep = 2;
  if (issue.status === 'In Progress') workflowStep = 3;
  if (issue.status === 'Completed') workflowStep = 4;
  if (issue.status === 'Resolved') workflowStep = 5;

  const imageUrl = getBackendUrl(issue.image);
  const resolutionImageUrl = getBackendUrl(issue.resolutionImage);

  // AI Verdict Result Badge styling
  const getAIResultStyle = (result) => {
    switch (result) {
      case 'Cleaned':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: 'var(--color-secondary)', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'Partially Cleaned':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: 'var(--color-warning)', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'Not Cleaned':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'rgba(255,255,255,0.05)', text: 'var(--text-muted)', border: '1px solid var(--border-color)' };
    }
  };

  const aiResultStyle = getAIResultStyle(issue.aiResolutionResult);

  return (
    <div>
      <Navbar title="Issue Tracking Details" />

      {/* LIGHTBOX ZOOM MODAL */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            padding: '2rem'
          }}
        >
          <img 
            src={zoomImage} 
            alt="Zoomed view" 
            style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }} 
          />
        </div>
      )}

      <div className="fade-in" style={{ marginTop: '1rem' }}>
        
        {/* Back navigation */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        {/* 5-STAGE WORKFLOW TIMELINE TRACKER */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Resolution Progression Status</h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', flexWrap: 'wrap', gap: '1rem' }}>
            
            {/* Step 1 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: workflowStep >= 1 ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                color: workflowStep >= 1 ? '#000' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem'
              }}>{workflowStep > 1 ? <Check size={14} /> : '1'}</div>
              <span style={{ fontSize: '0.85rem', color: workflowStep >= 1 ? '#fff' : 'var(--text-muted)', fontWeight: workflowStep === 1 ? 'bold' : 'normal' }}>Reported</span>
            </div>

            <div style={{ flexGrow: 1, height: '2px', minWidth: '20px', background: workflowStep >= 2 ? 'var(--color-primary)' : 'var(--border-color)' }}></div>

            {/* Step 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: workflowStep >= 2 ? 'var(--color-warning)' : 'rgba(255,255,255,0.05)',
                color: workflowStep >= 2 ? '#000' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem'
              }}>{workflowStep > 2 ? <Check size={14} /> : '2'}</div>
              <span style={{ fontSize: '0.85rem', color: workflowStep >= 2 ? '#fff' : 'var(--text-muted)', fontWeight: workflowStep === 2 ? 'bold' : 'normal' }}>Verified</span>
            </div>

            <div style={{ flexGrow: 1, height: '2px', minWidth: '20px', background: workflowStep >= 3 ? 'var(--color-primary)' : 'var(--border-color)' }}></div>

            {/* Step 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: workflowStep >= 3 ? 'var(--color-info)' : 'rgba(255,255,255,0.05)',
                color: workflowStep >= 3 ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem'
              }}>{workflowStep > 3 ? <Check size={14} /> : '3'}</div>
              <span style={{ fontSize: '0.85rem', color: workflowStep >= 3 ? '#fff' : 'var(--text-muted)', fontWeight: workflowStep === 3 ? 'bold' : 'normal' }}>Assigned</span>
            </div>

            <div style={{ flexGrow: 1, height: '2px', minWidth: '20px', background: workflowStep >= 4 ? 'var(--color-primary)' : 'var(--border-color)' }}></div>

            {/* Step 4 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: workflowStep >= 4 ? 'var(--color-secondary)' : 'rgba(255,255,255,0.05)',
                color: workflowStep >= 4 ? '#000' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem'
              }}>{workflowStep > 4 ? <Check size={14} /> : '4'}</div>
              <span style={{ fontSize: '0.85rem', color: workflowStep >= 4 ? '#fff' : 'var(--text-muted)', fontWeight: workflowStep === 4 ? 'bold' : 'normal' }}>Completed</span>
            </div>

            <div style={{ flexGrow: 1, height: '2px', minWidth: '20px', background: workflowStep >= 5 ? 'var(--color-primary)' : 'var(--border-color)' }}></div>

            {/* Step 5 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: workflowStep >= 5 ? 'var(--color-secondary)' : 'rgba(255,255,255,0.05)',
                color: workflowStep >= 5 ? '#000' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem'
              }}>{workflowStep > 5 ? <Check size={14} /> : '5'}</div>
              <span style={{ fontSize: '0.85rem', color: workflowStep >= 5 ? '#fff' : 'var(--text-muted)', fontWeight: workflowStep === 5 ? 'bold' : 'normal' }}>Resolved</span>
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

            {/* Geographical details & Address parameters */}
            {(issue.state || issue.district || issue.village) && (
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Administrative Location details</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: '#fff' }}>
                  <div>State: <strong>{issue.state || 'N/A'}</strong></div>
                  <div>District: <strong>{issue.district || 'N/A'}</strong></div>
                  <div>City/Town: <strong>{issue.city || 'N/A'}</strong></div>
                  <div>Village/Ward: <strong>{issue.village || 'N/A'}</strong></div>
                  {issue.landmark && <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>Landmark: <strong>{issue.landmark}</strong></div>}
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '1rem 0', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserIcon size={16} />
                <span>Reporter: <strong>{issue.reporter?.name || 'Anonymous'} (Lvl {issue.reporter?.level || 1})</strong></span>
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
                  <span>Verify ({issue.upvotes?.length || 0})</span>
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
                  <span>Spam ({issue.downvotes?.length || 0})</span>
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
            <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: 0 }}>Report Media Proof</h4>
                <button
                  type="button"
                  onClick={() => setZoomImage(imageUrl)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}
                >
                  <ZoomIn size={14} />
                  <span>Zoom</span>
                </button>
              </div>
              
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
                  onClick={() => setZoomImage(imageUrl)}
                  style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1594818868299-19c22221b0f3?auto=format&fit=crop&q=60&w=600';
                  }}
                />
              )}

              {/* Multiple Uploaded Proofs display list */}
              {issue.images && issue.images.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '10px', paddingBottom: '4px' }}>
                  {issue.images.map((imgUrl, index) => (
                    <img
                      key={index}
                      src={getBackendUrl(imgUrl)}
                      alt={`Upload Proof ${index + 1}`}
                      onClick={() => setZoomImage(getBackendUrl(imgUrl))}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', cursor: 'zoom-in', border: '1px solid var(--border-color)' }}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1594818868299-19c22221b0f3?auto=format&fit=crop&q=60&w=300'; }}
                    />
                  ))}
                </div>
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
        {(issue.status === 'Resolved' || issue.status === 'Completed' || issue.resolutionImage) && (
          <div className="glass-panel fade-in" style={{ padding: '2rem', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.03)', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <CheckCircle />
                <span>Gemini AI Resolution Auditor Verdict</span>
              </h3>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {issue.aiResolutionResult && (
                  <span style={{
                    fontSize: '0.85rem',
                    background: aiResultStyle.bg,
                    color: aiResultStyle.text,
                    border: aiResultStyle.border,
                    padding: '3px 12px',
                    borderRadius: '20px',
                    fontWeight: 800
                  }}>
                    {issue.aiResolutionResult}
                  </span>
                )}
                
                {issue.aiResolutionConfidence && (
                  <span style={{ 
                    fontSize: '0.85rem', 
                    background: issue.aiResolutionConfidence >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: issue.aiResolutionConfidence >= 80 ? 'var(--color-secondary)' : 'var(--color-warning)',
                    padding: '3px 10px', 
                    borderRadius: '20px', 
                    fontWeight: 800,
                    border: `1px solid ${issue.aiResolutionConfidence >= 80 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                  }}>
                    {issue.aiResolutionConfidence}% AI Match
                  </span>
                )}
              </div>
            </div>

            <div className="grid-2" style={{ gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.5rem' }}>Resolution details</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                  {issue.aiResolutionDetails || 'Work completed by assigned Staff. Resolution verification proof awaits official administrator audit execution.'}
                </p>
                {issue.resolvedAt && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
                    Resolved at: <strong>{new Date(issue.resolvedAt).toLocaleString()}</strong> by <strong>Municipal Admin</strong>
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: 0 }}>Before & After Comparison</h4>
                  <button
                    type="button"
                    onClick={() => setZoomImage(resolutionImageUrl)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}
                  >
                    <ZoomIn size={12} />
                    <span>Zoom After</span>
                  </button>
                </div>
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
                        onClick={() => setZoomImage(imageUrl)}
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'zoom-in' }}
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
                        onClick={() => setZoomImage(resolutionImageUrl)}
                        style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'zoom-in' }}
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
