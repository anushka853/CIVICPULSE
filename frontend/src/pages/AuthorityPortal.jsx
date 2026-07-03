import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '../context/GlobalContext';
import Navbar from '../components/Navbar';
import { 
  ShieldCheck, 
  Upload, 
  Check, 
  Clock, 
  Loader2, 
  CheckCircle,
  AlertTriangle,
  Award,
  User as UserIcon,
  DollarSign,
  Merge,
  ZoomIn
} from 'lucide-react';

const isVideoFile = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const AuthorityPortal = () => {
  const { 
    issues, 
    fetchIssues, 
    resolveIssue, 
    user, 
    staffUsers, 
    fetchStaffUsers, 
    assignIssue, 
    mergeIssues, 
    analytics, 
    fetchAnalytics,
    getBackendUrl
  } = useContext(GlobalContext);

  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionPreview, setResolutionPreview] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [zoomImage, setZoomImage] = useState(null);

  // Address-based Staff Filtering States
  const [staffFilters, setStaffFilters] = useState({
    state: '',
    district: '',
    city: '',
    village: '',
    pinCode: '',
    searchQuery: '',
  });
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);


  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authorized
    if (!user || user.role !== 'Admin') {
      navigate('/');
    } else {
      fetchIssues();
      fetchStaffUsers();
      fetchAnalytics();
    }
  }, [user, navigate]);

  const handleIssueSelect = (id) => {
    setSelectedIssueId(selectedIssueId === id ? null : id);
    setResolutionFile(null);
    setResolutionPreview('');
    setVerificationResult(null);
    setSelectedStaffId('');
    setError('');
    setSuccessMsg('');
    setAiRecommendation(null);
    setStaffFilters({
      state: '',
      district: '',
      city: '',
      village: '',
      pinCode: '',
      searchQuery: '',
    });
  };

  const handleFetchRecommendation = async () => {
    if (!selectedIssueId) return;
    setRecommendationLoading(true);
    setError('');
    try {
      const token = user?.token;
      const baseUrl = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'http://localhost:5000/api'
        : '/api';
      const res = await fetch(`${baseUrl}/issues/${selectedIssueId}/recommend-staff`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch AI recommendation');
      setAiRecommendation(data);
      if (data.recommendedStaffId) {
        setSelectedStaffId(data.recommendedStaffId);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error fetching AI recommendation');
    } finally {
      setRecommendationLoading(false);
    }
  };


  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) return setError('Please select a staff member.');

    setProcessing(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await assignIssue(selectedIssueId, selectedStaffId);
      if (res.success) {
        setSuccessMsg('Staff member assigned successfully! Status is now In Progress.');
        fetchIssues();
      } else {
        setError(res.error || 'Assignment failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during assignment.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionFile(file);
      setResolutionPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    setVerificationResult(null);
    setSuccessMsg('');

    try {
      let res;
      if (resolutionFile) {
        // Manual override upload
        const data = new FormData();
        data.append('resolutionImage', resolutionFile);
        res = await resolveIssue(selectedIssueId, data);
      } else {
        // Use existing photo uploaded by Staff
        res = await resolveIssue(selectedIssueId);
      }

      if (res.success) {
        setVerificationResult(res.data);
        fetchIssues();
        fetchAnalytics();
      } else {
        setError(res.error || 'AI verification failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during resolution verification.');
    } finally {
      setProcessing(false);
    }
  };

  const handleMergeSubmit = async (duplicateId) => {
    setProcessing(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await mergeIssues(selectedIssueId, duplicateId);
      if (res.success) {
        setSuccessMsg('Duplicate issue successfully merged into this task!');
        fetchIssues();
      } else {
        setError(res.error || 'Merging failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while merging issues.');
    } finally {
      setProcessing(false);
    }
  };

  // Find active selected issue
  const activeIssue = issues.find(i => i._id === selectedIssueId);

  // Group issues into categories
  const completedIssues = issues.filter(i => i.status === 'Completed');
  const inProgressIssues = issues.filter(i => i.status === 'In Progress' && !i.isDuplicateOf);
  const openReports = issues.filter(i => (i.status === 'Reported' || i.status === 'Verified') && !i.isDuplicateOf);

  // Identify nearby duplicates for selected issue (same category, within 150m, not resolved)
  const nearbyDuplicates = activeIssue ? issues.filter(i => 
    i._id !== activeIssue._id &&
    i.category === activeIssue.category &&
    i.status !== 'Resolved' &&
    !i.isDuplicateOf &&
    Math.abs(i.latitude - activeIssue.latitude) < 0.0015 &&
    Math.abs(i.longitude - activeIssue.longitude) < 0.0015
  ) : [];

  // Filter staff based on address fields
  const filteredStaff = staffUsers.filter((staff) => {
    const matchState = !staffFilters.state || (staff.state && staff.state.toLowerCase().includes(staffFilters.state.toLowerCase()));
    const matchDistrict = !staffFilters.district || (staff.district && staff.district.toLowerCase().includes(staffFilters.district.toLowerCase()));
    const matchCity = !staffFilters.city || (staff.city && staff.city.toLowerCase().includes(staffFilters.city.toLowerCase()));
    const matchVillage = !staffFilters.village || (staff.village && staff.village.toLowerCase().includes(staffFilters.village.toLowerCase()));
    const matchPinCode = !staffFilters.pinCode || (staff.pinCode && staff.pinCode.includes(staffFilters.pinCode));
    const matchQuery = !staffFilters.searchQuery || 
      staff.name.toLowerCase().includes(staffFilters.searchQuery.toLowerCase()) || 
      staff.email.toLowerCase().includes(staffFilters.searchQuery.toLowerCase());
    
    return matchState && matchDistrict && matchCity && matchVillage && matchPinCode && matchQuery;
  });

  // Budget details
  const totalIncurredCost = analytics?.summary?.totalCost || 0;
  const budgetLimit = 100000; // Mock Budget
  const budgetPercent = Math.min((totalIncurredCost / budgetLimit) * 100, 100);


  return (
    <div>
      <Navbar title="Authority Portal & Budget Planner" />

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
        
        {/* SECURE HEADER */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <ShieldCheck color="var(--color-secondary)" size={20} />
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-secondary)', display: 'block' }}>SECURE ACCESS: MUNICIPAL ADMINISTRATION WORKSPACE</span>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Audit resolutions, assign field workers, handle duplicate reports, and review budget expenditures.
            </p>
          </div>
        </div>

        <div className="grid-2">
          
          {/* Left Panel: Active Issues Lists */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Budget & Expense Card */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={18} color="var(--color-secondary)" />
                <span>Municipal Repair Budget Planner</span>
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Budget Utilization</span>
                <strong style={{ color: 'var(--color-secondary)' }}>₹{totalIncurredCost} / ₹{budgetLimit} Spent</strong>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${budgetPercent}%`, height: '100%', background: 'linear-gradient(to right, var(--color-secondary), var(--color-warning))' }} />
              </div>
            </div>

            {/* List of Tasks */}
            <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: '550px', overflowY: 'auto' }}>
              
              {/* Category 1: Completed Tasks (Pending Audit) */}
              <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-secondary)' }}>Completed (Awaiting Audit)</span>
                <span style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0 6px', borderRadius: '8px' }}>{completedIssues.length}</span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {completedIssues.map((issue) => (
                  <div 
                    key={issue._id}
                    onClick={() => handleIssueSelect(issue._id)}
                    style={{
                      padding: '0.85rem',
                      background: selectedIssueId === issue._id ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${selectedIssueId === issue._id ? 'var(--color-secondary)' : 'var(--border-color)'}`,
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>{issue.title}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-secondary)', fontWeight: 600 }}>Completed</span>
                    </div>
                  </div>
                ))}
                {completedIssues.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', textAlign: 'center' }}>No completed issues awaiting audit.</span>
                )}
              </div>

              {/* Category 2: In Progress Tasks */}
              <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-primary)' }}>In Progress (Assigned)</span>
                <span style={{ fontSize: '0.8rem', background: 'rgba(14, 165, 233, 0.1)', padding: '0 6px', borderRadius: '8px' }}>{inProgressIssues.length}</span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {inProgressIssues.map((issue) => (
                  <div 
                    key={issue._id}
                    onClick={() => handleIssueSelect(issue._id)}
                    style={{
                      padding: '0.85rem',
                      background: selectedIssueId === issue._id ? 'rgba(14, 165, 233, 0.08)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${selectedIssueId === issue._id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>{issue.title}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>In Progress</span>
                    </div>
                  </div>
                ))}
                {inProgressIssues.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', textAlign: 'center' }}>No tasks currently in progress.</span>
                )}
              </div>

              {/* Category 3: Open Community Reports */}
              <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-warning)' }}>Open Reports (Unassigned)</span>
                <span style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0 6px', borderRadius: '8px' }}>{openReports.length}</span>
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {openReports.map((issue) => (
                  <div 
                    key={issue._id}
                    onClick={() => handleIssueSelect(issue._id)}
                    style={{
                      padding: '0.85rem',
                      background: selectedIssueId === issue._id ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${selectedIssueId === issue._id ? 'var(--color-warning)' : 'var(--border-color)'}`,
                      borderRadius: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#fff' }}>{issue.title}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)', fontWeight: 600 }}>{issue.status}</span>
                    </div>
                  </div>
                ))}
                {openReports.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', textAlign: 'center' }}>No unassigned reports.</span>
                )}
              </div>

            </div>
          </div>

          {/* Right Panel: Resolution Form */}
          <div>
            {activeIssue ? (
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>Process: {activeIssue.title}</h3>
                
                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                {successMsg && (
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--color-secondary)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                    {successMsg}
                  </div>
                )}

                {verificationResult ? (
                  // Success AI Audit Verdict Card
                  <div style={{ 
                    background: 'rgba(16, 185, 129, 0.05)', 
                    border: '1px solid rgba(16, 185, 129, 0.2)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-secondary)' }}>
                      <CheckCircle />
                      <strong style={{ fontSize: '1rem' }}>AI Auditing Verified!</strong>
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {verificationResult.aiAnalysis?.details || verificationResult.issue?.aiResolutionDetails}
                    </p>

                    <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                      <div>Verdict Result: <strong style={{ color: 'var(--color-secondary)' }}>{verificationResult.issue?.aiResolutionResult || 'Cleaned'}</strong></div>
                      <div>Confidence Score: <strong style={{ color: 'var(--color-secondary)' }}>{verificationResult.aiAnalysis?.confidence || verificationResult.issue?.aiResolutionConfidence}%</strong></div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-warning)', fontSize: '0.75rem', fontWeight: 'bold', borderTop: '1px solid rgba(16,185,129,0.1)', paddingTop: '0.5rem' }}>
                      <Award size={14} />
                      <span>Citizen Reporter & Staff rewarded XP!</span>
                    </div>

                    <button 
                      onClick={() => handleIssueSelect(null)} 
                      className="btn btn-secondary" 
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                    >
                      Audit Next Task
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Visual Comparison */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Original Issue</span>
                        {isVideoFile(activeIssue.image) ? (
                          <video 
                            src={getBackendUrl(activeIssue.image)} 
                            controls
                            style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                          />
                        ) : (
                          <img 
                            src={getBackendUrl(activeIssue.image)} 
                            alt="Original" 
                            onClick={() => setZoomImage(getBackendUrl(activeIssue.image))}
                            style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'zoom-in' }}
                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1594818868299-19c22221b0f3?auto=format&fit=crop&q=60&w=300'; }}
                          />
                        )}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', display: 'block', marginBottom: '4px' }}>Resolution Proof</span>
                        {activeIssue.resolutionImage || resolutionPreview ? (
                          <img 
                            src={resolutionPreview || getBackendUrl(activeIssue.resolutionImage)} 
                            alt="Resolution" 
                            onClick={() => setZoomImage(resolutionPreview || getBackendUrl(activeIssue.resolutionImage))}
                            style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--color-secondary)', cursor: 'zoom-in' }} 
                          />
                        ) : (
                          <div style={{ width: '100%', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-dark)', fontSize: '0.75rem' }}>
                            No proof uploaded yet
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ASSIGNMENT FLOW FOR REPORTED/VERIFIED WITH ADDRESS FILTERING AND AI RECOMMENDATION */}
                    {(activeIssue.status === 'Reported' || activeIssue.status === 'Verified') && (
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label className="form-label" style={{ margin: 0 }}>Filter Available Staff by Complaint Address</label>
                            <button
                              type="button"
                              onClick={() => {
                                setStaffFilters({
                                  state: activeIssue.state || '',
                                  district: activeIssue.district || '',
                                  city: activeIssue.city || '',
                                  village: activeIssue.village || '',
                                  pinCode: activeIssue.pinCode || '',
                                  searchQuery: ''
                                });
                              }}
                              style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                color: 'var(--color-secondary)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                            >
                              Autofill Address Filters
                            </button>
                          </div>
                          
                          <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                              type="text"
                              placeholder="State"
                              value={staffFilters.state}
                              onChange={(e) => setStaffFilters({ ...staffFilters, state: e.target.value })}
                              className="form-control"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            />
                            <input
                              type="text"
                              placeholder="District"
                              value={staffFilters.district}
                              onChange={(e) => setStaffFilters({ ...staffFilters, district: e.target.value })}
                              className="form-control"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            />
                          </div>
                          <div className="grid-2" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                              type="text"
                              placeholder="City/Town"
                              value={staffFilters.city}
                              onChange={(e) => setStaffFilters({ ...staffFilters, city: e.target.value })}
                              className="form-control"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            />
                            <input
                              type="text"
                              placeholder="Village/Ward"
                              value={staffFilters.village}
                              onChange={(e) => setStaffFilters({ ...staffFilters, village: e.target.value })}
                              className="form-control"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            />
                          </div>
                          <div className="grid-2" style={{ gap: '0.5rem' }}>
                            <input
                              type="text"
                              placeholder="PIN Code"
                              value={staffFilters.pinCode}
                              onChange={(e) => setStaffFilters({ ...staffFilters, pinCode: e.target.value })}
                              className="form-control"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            />
                            <input
                              type="text"
                              placeholder="Search Staff Name/Email..."
                              value={staffFilters.searchQuery}
                              onChange={(e) => setStaffFilters({ ...staffFilters, searchQuery: e.target.value })}
                              className="form-control"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>

                        {/* Ask Gemini AI Dispatcher Recommendation */}
                        <div style={{
                          background: 'rgba(99, 102, 241, 0.06)',
                          border: '1px dashed rgba(99, 102, 241, 0.3)',
                          borderRadius: '12px',
                          padding: '0.85rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>Gemini AI Proximity Dispatcher</span>
                            <button
                              type="button"
                              onClick={handleFetchRecommendation}
                              disabled={recommendationLoading}
                              style={{
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                color: '#white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                              }}
                            >
                              {recommendationLoading ? 'Analyzing...' : 'Ask AI to Recommend'}
                            </button>
                          </div>

                          {aiRecommendation && (
                            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                              <div>AI Selected: <strong style={{ color: 'var(--color-primary)' }}>{aiRecommendation.name}</strong></div>
                              <p style={{ marginTop: '0.25rem', fontStyle: 'italic', fontSize: '0.75rem', lineHeight: '1.3' }}>
                                {aiRecommendation.reason}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Staff Cards matching criteria */}
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', display: 'block', marginBottom: '0.5rem' }}>
                            Matching Staff Members ({filteredStaff.length})
                          </span>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                            {filteredStaff.map((staff) => {
                              const isSelected = selectedStaffId === staff._id;
                              const isAreaMatch = (
                                (staff.village && activeIssue.village && staff.village.toLowerCase() === activeIssue.village.toLowerCase()) ||
                                (staff.city && activeIssue.city && staff.city.toLowerCase() === activeIssue.city.toLowerCase()) ||
                                (staff.district && activeIssue.district && staff.district.toLowerCase() === activeIssue.district.toLowerCase()) ||
                                (staff.pinCode && activeIssue.pinCode && staff.pinCode === activeIssue.pinCode)
                              );
                              
                              return (
                                <div
                                  key={staff._id}
                                  onClick={() => setSelectedStaffId(staff._id)}
                                  style={{
                                    padding: '0.65rem 0.85rem',
                                    background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                                    border: `1px solid ${isSelected ? 'var(--color-secondary)' : 'var(--border-color)'}`,
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                      <span>{staff.name}</span>
                                      {isAreaMatch && <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-secondary)', padding: '1px 6px', borderRadius: '4px' }}>Proximity Match</span>}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                                      {staff.village || 'No Ward'}, {staff.city || 'No City'}, {staff.district || 'No District'} ({staff.pinCode || 'No PIN'})
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>LVL {staff.level || 1}</span>
                                    <div style={{
                                      width: '16px',
                                      height: '16px',
                                      borderRadius: '50%',
                                      border: `2px solid ${isSelected ? 'var(--color-secondary)' : 'var(--border-color)'}`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: isSelected ? 'var(--color-secondary)' : 'none'
                                    }}>
                                      {isSelected && <Check size={10} color="#000" />}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {filteredStaff.length === 0 && (
                              <div style={{
                                background: 'rgba(239, 68, 68, 0.05)',
                                border: '1px dashed rgba(239, 68, 68, 0.2)',
                                color: 'var(--color-danger)',
                                padding: '0.75rem',
                                borderRadius: '10px',
                                fontSize: '0.75rem',
                                textAlign: 'center'
                              }}>
                                ⚠️ No employees available at this address/filters. Please clear address filters to view all workers.
                              </div>
                            )}
                          </div>
                        </div>

                        <form onSubmit={handleAssignSubmit}>
                          <button
                            type="submit"
                            disabled={processing || !selectedStaffId}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '0.75rem', background: 'var(--color-secondary)', color: '#000' }}
                          >
                            {processing ? 'Allocating...' : 'Allocate Work to Selected Employee'}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* IN PROGRESS STATUS REPORT */}
                    {activeIssue.status === 'In Progress' && (
                      <div style={{ padding: '0.85rem', background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.1)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <strong>Current Status:</strong> Assigned worker is currently traveling to coordinates. Resolution proof pending check-in and cleanup.
                      </div>
                    )}

                    {/* EXECUTE GEMINI AUDIT RESOLVE FLOW */}
                    {(activeIssue.status === 'Completed' || activeIssue.resolutionImage) && (
                      <form onSubmit={handleResolveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        
                        {/* Option to upload manual override photo */}
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Upload manual override resolution photo (Optional)</label>
                          <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <Upload size={16} />
                            <span>{resolutionFile ? resolutionFile.name : 'Select Override File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              style={{ display: 'none' }}
                              disabled={processing}
                            />
                          </label>
                        </div>

                        <button 
                          type="submit" 
                          className="btn btn-success" 
                          disabled={processing}
                          style={{ width: '100%', padding: '0.85rem' }}
                        >
                          {processing ? (
                            <>
                              <Loader2 className="animate-spin" size={16} />
                              <span>Gemini AI Auditing Resolution Comparison...</span>
                            </>
                          ) : (
                            <>
                              <Check size={16} />
                              <span>Execute Gemini AI Audit Verdict</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* DUPLICATE MERGER SECTION */}
                    {nearbyDuplicates.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Merge size={14} color="var(--color-primary)" />
                          <span>Nearby Duplicate Complaints ({nearbyDuplicates.length})</span>
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                          These complaints are reported in the same location and category. Merge them to resolve together!
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {nearbyDuplicates.map((dup) => (
                            <div 
                              key={dup._id} 
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '0.5rem 0.75rem', 
                                background: 'rgba(255,255,255,0.01)', 
                                border: '1px solid var(--border-color)', 
                                borderRadius: '8px' 
                              }}
                            >
                              <div style={{ overflow: 'hidden' }}>
                                <strong style={{ fontSize: '0.8rem', color: '#fff', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{dup.title}</strong>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)' }}>By: {dup.reporter?.name || 'Citizen'}</span>
                              </div>
                              <button
                                onClick={() => handleMergeSubmit(dup._id)}
                                disabled={processing}
                                className="btn btn-secondary"
                                style={{ padding: '3px 8px', fontSize: '0.7rem', height: 'auto', borderRadius: '6px', width: 'auto' }}
                              >
                                Merge
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-dark)' }}>
                <Clock size={36} style={{ marginBottom: '1rem' }} />
                <h4>Select an issue from the lists to begin audit verification</h4>
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

export default AuthorityPortal;
