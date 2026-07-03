import React, { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { 
  Briefcase, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  Upload, 
  Loader2, 
  Compass, 
  Clock, 
  Check,
  ZoomIn
} from 'lucide-react';

const isVideoFile = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const StaffPortal = () => {
  const { 
    issues, 
    fetchIssues, 
    checkInStaff, 
    completeStaffIssue, 
    user, 
    getBackendUrl 
  } = useContext(GlobalContext);

  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionPreview, setResolutionPreview] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [zoomImage, setZoomImage] = useState(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleIssueSelect = (id) => {
    setSelectedIssueId(selectedIssueId === id ? null : id);
    setResolutionFile(null);
    setResolutionPreview('');
    setMessage({ text: '', type: '' });
  };

  const handleCheckIn = async (id) => {
    setCheckingIn(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await checkInStaff(id);
      if (res.success) {
        setMessage({ text: 'GPS Location Verified! Check-in successful.', type: 'success' });
      } else {
        setMessage({ text: res.error || 'Check-in failed', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error performing check-in', type: 'error' });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionFile(file);
      setResolutionPreview(URL.createObjectURL(file));
      setMessage({ text: '', type: '' });
    }
  };

  const handleCompleteSubmit = async (e, id) => {
    e.preventDefault();
    if (!resolutionFile) {
      return setMessage({ text: 'Please select a proof photo before submitting.', type: 'error' });
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const data = new FormData();
      data.append('resolutionImage', resolutionFile);

      const res = await completeStaffIssue(id, data);
      if (res.success) {
        setMessage({ text: 'Resolution proof submitted! Awaiting Admin verification.', type: 'success' });
        setResolutionFile(null);
        setResolutionPreview('');
      } else {
        setMessage({ text: res.error || 'Submission failed', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Error submitting proof', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter issues assigned to this specific staff member
  const myIssues = issues.filter(issue => 
    issue.assignedStaff === user._id && issue.status !== 'Resolved'
  );

  const activeIssue = myIssues.find(i => i._id === selectedIssueId);

  return (
    <div>
      <Navbar title="Working Staff Taskboard" />

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
        
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          alignItems: 'center', 
          background: 'rgba(139, 92, 246, 0.08)', 
          border: '1px solid rgba(139, 92, 246, 0.2)', 
          padding: '1rem', 
          borderRadius: '12px', 
          marginBottom: '2rem' 
        }}>
          <Briefcase color="#a78bfa" size={20} />
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#a78bfa', display: 'block' }}>FIELD WORKER WORKSPACE</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Welcome back, {user.name}. Travel to coordinates of assigned tickets, check-in to verify location, and upload completed photos to submit for AI Audit.
            </p>
          </div>
        </div>

        <div className="grid-2">
          
          {/* Left panel: Task list */}
          <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: '550px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.25rem' }}>Assigned Maintenance Tasks</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {myIssues.map((issue) => (
                <div 
                  key={issue._id}
                  onClick={() => handleIssueSelect(issue._id)}
                  style={{
                    padding: '1rem',
                    background: selectedIssueId === issue._id ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${selectedIssueId === issue._id ? '#8b5cf6' : 'var(--border-color)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>{issue.title}</h4>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: issue.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                      color: issue.status === 'Completed' ? 'var(--color-secondary)' : 'var(--color-warning)', 
                      padding: '1px 6px', 
                      borderRadius: '8px',
                      fontWeight: 600 
                    }}>{issue.status}</span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {issue.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                    <span>Category: <strong>{issue.category}</strong></span>
                    <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{issue.severity} Priority</span>
                  </div>
                </div>
              ))}

              {myIssues.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dark)' }}>
                  All clear! You have no pending assigned tasks today.
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Active task actions */}
          <div>
            {activeIssue ? (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.25rem' }}>Task: {activeIssue.title}</h3>

                {message.text && (
                  <div style={{ 
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, 
                    color: message.type === 'success' ? 'var(--color-secondary)' : 'var(--color-danger)', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    marginBottom: '1.25rem' 
                  }}>
                    {message.text}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Original Reported Image reference */}
                  <div style={{ background: 'rgba(255,255,255,0.01)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>ORIGINAL BEFORE PROOF</span>
                      <button
                        type="button"
                        onClick={() => setZoomImage(getBackendUrl(activeIssue.image))}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}
                      >
                        <ZoomIn size={12} />
                        <span>Zoom</span>
                      </button>
                    </div>
                    {isVideoFile(activeIssue.image) ? (
                      <video src={getBackendUrl(activeIssue.image)} controls style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <img 
                        src={getBackendUrl(activeIssue.image)} 
                        alt="Before" 
                        onClick={() => setZoomImage(getBackendUrl(activeIssue.image))}
                        style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in' }} 
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1594818868299-19c22221b0f3?auto=format&fit=crop&q=60&w=300'; }}
                      />
                    )}
                  </div>

                  {/* Location & Map details */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <MapPin size={28} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', display: 'block' }}>GPS COORDINATES</span>
                      <strong style={{ fontSize: '0.85rem', color: '#fff' }}>Lat: {activeIssue.latitude.toFixed(5)}, Lng: {activeIssue.longitude.toFixed(5)}</strong>
                    </div>
                  </div>

                  <div style={{ height: '140px', borderRadius: '8px', overflow: 'hidden' }}>
                    <MapComponent issues={[activeIssue]} center={[activeIssue.latitude, activeIssue.longitude]} zoom={14} />
                  </div>

                  {/* Step 1: Check-in */}
                  {!activeIssue.checkInVerified ? (
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(245,158,11,0.04)', border: '1px dashed rgba(245,158,11,0.2)', borderRadius: '10px' }}>
                      <Compass size={32} color="var(--color-warning)" style={{ margin: '0 auto 0.5rem' }} />
                      <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.25rem' }}>Step 1: Check-in at Location</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Before starting repairs, verify you are physically at the coordinates.
                      </p>
                      
                      <button
                        onClick={() => handleCheckIn(activeIssue._id)}
                        disabled={checkingIn}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.75rem', background: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
                      >
                        {checkingIn ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Verifying coordinates...</span>
                          </>
                        ) : (
                          <>
                            <Compass size={16} />
                            <span>Verify GPS Check-In</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--color-secondary)', fontWeight: 'bold' }}>
                      <CheckCircle size={18} />
                      <span>Checked-in at coordinates successfully!</span>
                    </div>
                  )}

                  {/* Step 2: Completion Upload */}
                  {activeIssue.checkInVerified && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                      {activeIssue.status === 'Completed' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.03)', border: '1px dashed rgba(16, 185, 129, 0.2)', borderRadius: '10px', textAlign: 'center' }}>
                          <CheckCircle size={32} color="var(--color-secondary)" style={{ margin: '0 auto' }} />
                          <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Proof Submitted Successfully</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Awaiting verification comparison audit and final sign-off from Municipal Administrator.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={(e) => handleCompleteSubmit(e, activeIssue._id)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>Step 2: Submit Resolution Proof</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Snap and upload a picture of the resolved/clean site. Gemini AI will match it against original issue proof.
                          </p>

                          {resolutionPreview && (
                            <img 
                              src={resolutionPreview} 
                              alt="Fixed proof preview" 
                              style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-primary)' }} 
                            />
                          )}

                          <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <Upload size={16} />
                            <span>{resolutionFile ? resolutionFile.name : 'Choose Proof Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              style={{ display: 'none' }}
                              disabled={submitting}
                            />
                          </label>

                          <button 
                            type="submit" 
                            className="btn btn-success" 
                            disabled={submitting || !resolutionFile}
                            style={{ width: '100%', padding: '0.75rem' }}
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>Submitting resolution proof...</span>
                              </>
                            ) : (
                              <>
                                <Check size={16} />
                                <span>Submit Completed Work</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-dark)' }}>
                <Clock size={36} style={{ marginBottom: '1rem' }} />
                <h4>Select an assigned task from the left to begin field maintenance</h4>
              </div>
            )}
          </div>

        </div>

      </div>

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StaffPortal;
