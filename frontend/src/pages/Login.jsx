import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '../context/GlobalContext';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  KeyRound, 
  ArrowLeft, 
  AlertCircle,
  Briefcase,
  ShieldCheck,
  Globe
} from 'lucide-react';

const Login = () => {
  const { 
    login, 
    signup, 
    logout,
    user, 
    sendOtp, 
    submitForgotPassword, 
    submitResetPassword
  } = useContext(GlobalContext);


  const [activeTab, setActiveTab] = useState('Citizen'); // 'Citizen', 'Staff', 'Admin'
  const [isRegister, setIsRegister] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    state: '',
    district: '',
    city: '',
    village: '',
    pinCode: '',
    serviceArea: '',
    workingRadius: 5,
    otp: ''
  });

  const [forgotData, setForgotData] = useState({
    email: '',
    otp: '',
    newPassword: ''
  });

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setInfo('');
  };

  const handleForgotChange = (e) => {
    setForgotData({ ...forgotData, [e.target.name]: e.target.value });
    setError('');
    setInfo('');
  };

  // Send Registration OTP
  const handleSendRegisterOtp = async () => {
    if (!formData.email) {
      return setError('Please enter your email address first.');
    }
    setError('');
    setInfo('');
    setOtpLoading(true);
    const res = await sendOtp(formData.email, 'verification');
    setOtpLoading(false);
    if (res.success) {
      setOtpSent(true);
      if (res.devOtp) {
        setFormData(prev => ({ ...prev, otp: res.devOtp }));
        setInfo(`Verification code generated: ${res.devOtp}. (Sandbox Mode: Auto-filled the OTP code for you!)`);
      } else {
        setInfo('Verification OTP sent successfully! Please check your email inbox.');
      }
    } else {
      setError(res.error || 'Failed to send OTP.');
    }
  };

  // Send Forgot Password OTP
  const handleSendForgotOtp = async () => {
    if (!forgotData.email) {
      return setError('Please enter your email address first.');
    }
    setError('');
    setInfo('');
    setOtpLoading(true);
    const res = await submitForgotPassword(forgotData.email);
    setOtpLoading(false);
    if (res.success) {
      setOtpSent(true);
      if (res.devOtp) {
        setForgotData(prev => ({ ...prev, otp: res.devOtp }));
        setInfo(`Password reset OTP generated: ${res.devOtp}. (Sandbox Mode: Auto-filled the code for you!)`);
      } else {
        setInfo('Password reset OTP sent successfully! Please check your email inbox.');
      }
    } else {
      setError(res.error || 'Failed to send reset code.');
    }
  };

  // Handle signup/registration form submit
  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!formData.otp) {
      return setError('Please enter the 6-digit OTP code sent to your email.');
    }

    setOtpLoading(true);
    const signupData = {
      ...formData,
      role: activeTab // Auto-assign role based on active selected workspace
    };

    const res = await signup(signupData);
    setOtpLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Registration failed. Make sure OTP is correct.');
    }
  };

  // Handle login form submit
  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!formData.email || !formData.password) {
      return setError('Please fill all fields');
    }

    setOtpLoading(true);
    const res = await login(formData.email, formData.password);
    setOtpLoading(false);

    if (res.success) {
      // Validate role against selected workspace portal
      if (res.user.role !== activeTab) {
        setError(`Access Denied: Your account is registered as a ${res.user.role}. Please select the correct Workspace tab at the top.`);
        logout();
        return;
      }
      navigate('/');
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  // Handle forgot password reset submit
  const handleSubmitReset = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!forgotData.otp || !forgotData.newPassword) {
      return setError('Please enter the OTP code and your new password.');
    }

    setOtpLoading(true);
    const res = await submitResetPassword(forgotData.email, forgotData.otp, forgotData.newPassword);
    setOtpLoading(false);

    if (res.success) {
      setForgotMode(false);
      setOtpSent(false);
      setIsRegister(false);
      setInfo('Password reset successfully! You can now log in.');
    } else {
      setError(res.error || 'Failed to reset password. Check OTP code.');
    }
  };

  const getPortalDetails = () => {
    switch (activeTab) {
      case 'Citizen':
        return {
          title: 'Citizen Hub',
          desc: 'Report street issues, track community fixes, and earn local XP rewards.',
          themeColor: 'var(--color-primary)',
          glow: 'rgba(14, 165, 233, 0.4)'
        };
      case 'Staff':
        return {
          title: 'Field Workers Portal',
          desc: 'Access your assigned tasks, navigate to coordinates, and upload cleanup proofs.',
          themeColor: 'var(--color-warning)',
          glow: 'rgba(245, 158, 11, 0.4)'
        };
      case 'Admin':
        return {
          title: 'Municipal Dashboard',
          desc: 'Oversee civic operations, assign workers, verify resolutions, and audit budgets.',
          themeColor: 'var(--color-secondary)',
          glow: 'rgba(16, 185, 129, 0.4)'
        };
      default:
        return {};
    }
  };

  const portal = getPortalDetails();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #182235 0%, #070a12 100%)',
      padding: '1.5rem 1rem'
    }}>
      <div className="glass-panel fade-in" style={{
        width: '100%',
        maxWidth: isRegister ? '720px' : '450px',
        padding: '2.25rem',
        boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,255,255,0.06)',
        maxHeight: '94vh',
        overflowY: 'auto',
        borderRadius: '24px'
      }}>

        {/* Portal Header Details */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            background: `linear-gradient(135deg, ${portal.themeColor}, #6366f1)`,
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: `0 0 20px ${portal.glow}`,
            marginBottom: '0.75rem',
            transition: 'all 0.3s ease'
          }}>
            {activeTab === 'Citizen' ? <Globe size={26} /> : activeTab === 'Staff' ? <Briefcase size={26} /> : <ShieldCheck size={26} />}
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.35rem' }}>
            {forgotMode 
              ? 'Reset Password' 
              : isRegister 
                ? `Join ${portal.title}` 
                : `${portal.title} Sign In`}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', maxWidth: '340px', marginInline: 'auto' }}>
            {forgotMode ? 'Verify your identity to choose a new password.' : portal.desc}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--color-danger)',
            padding: '0.85rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div style={{
            background: 'rgba(14, 165, 233, 0.08)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            color: 'var(--color-primary)',
            padding: '0.85rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {info}
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {forgotMode ? (
          <form onSubmit={handleSubmitReset}>
            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  value={forgotData.email}
                  onChange={handleForgotChange}
                  placeholder="name@gmail.com"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={otpSent || otpLoading}
                  required
                />
                <Mail size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
              </div>
            </div>

            {otpSent && (
              <>
                <div className="form-group">
                  <label className="form-label">Enter 6-Digit OTP</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="otp"
                      value={forgotData.otp}
                      onChange={handleForgotChange}
                      placeholder="XXXXXX"
                      className="form-control"
                      style={{ paddingLeft: '2.5rem', letterSpacing: '2px', fontWeight: 'bold' }}
                      required
                    />
                    <KeyRound size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Choose New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      name="newPassword"
                      value={forgotData.newPassword}
                      onChange={handleForgotChange}
                      placeholder="••••••••"
                      className="form-control"
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                    <Lock size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: '1.5rem' }}>
              {!otpSent ? (
                <button 
                  type="button" 
                  onClick={handleSendForgotOtp} 
                  disabled={otpLoading}
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                >
                  {otpLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={otpLoading}
                  className="btn btn-success" 
                  style={{ width: '100%' }}
                >
                  {otpLoading ? 'Updating...' : 'Update Password'}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setOtpSent(false);
                setError('');
                setInfo('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
                marginTop: '1rem',
                marginRight: 'auto',
                marginLeft: 'auto'
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </button>
          </form>
        ) : isRegister ? (
          /* DYNAMIC REGISTRATION FORM */
          <form onSubmit={handleSubmitRegister}>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div>
                <h4 style={{ color: '#fff', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>Profile details</h4>
                
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Aarav Sharma"
                      className="form-control"
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                    <UserIcon size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="aarav@gmail.com"
                      className="form-control"
                      style={{ paddingLeft: '2.5rem' }}
                      disabled={otpSent}
                      required
                    />
                    <Mail size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="form-control"
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                    <Lock size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="form-control"
                      style={{ paddingLeft: '2.5rem' }}
                      required
                    />
                    <Phone size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#fff', fontSize: '0.9rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem', marginBottom: '0.75rem' }}>Geographic location</h4>
                
                <div className="grid-2" style={{ gap: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Bihar"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District</label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="Patna"
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">City/Town</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Patna"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Village/Ward</label>
                    <input
                      type="text"
                      name="village"
                      value={formData.village}
                      onChange={handleChange}
                      placeholder="Ward 12"
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                    placeholder="800001"
                    className="form-control"
                    required
                  />
                </div>

                {activeTab === 'Staff' && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-warning)', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Worker Preferences</span>
                    <div className="form-group">
                      <label className="form-label">Assigned Work Circle Area</label>
                      <input
                        type="text"
                        name="serviceArea"
                        value={formData.serviceArea}
                        onChange={handleChange}
                        placeholder="Patna West Area"
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Working Radius ({formData.workingRadius} km)</label>
                      <input
                        type="range"
                        name="workingRadius"
                        min="5"
                        max="25"
                        value={formData.workingRadius}
                        onChange={handleChange}
                        style={{ width: '100%', accentColor: 'var(--color-warning)' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* OTP SUBMISSION */}
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              {otpSent ? (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--color-secondary)' }}>Enter 6-digit OTP</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="XXXXXX"
                      className="form-control"
                      style={{ letterSpacing: '3px', fontWeight: 'bold', fontSize: '1.1rem', textAlign: 'center' }}
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={otpLoading}
                      className="btn btn-success" 
                      style={{ width: 'auto', padding: '0 1.5rem', background: portal.themeColor }}
                    >
                      {otpLoading ? 'Signing up...' : 'Sign Up'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendRegisterOtp}
                  disabled={otpLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', background: portal.themeColor }}
                >
                  {otpLoading ? 'Requesting...' : 'Request OTP Verification'}
                </button>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Already registered?</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setOtpSent(false);
                  setError('');
                  setInfo('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: portal.themeColor,
                  cursor: 'pointer',
                  fontWeight: 700,
                  textDecoration: 'underline'
                }}
              >
                Sign In
              </button>
            </div>
          </form>
        ) : (
          /* STANDARD SIGN IN FORM */
          <form onSubmit={handleSubmitLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@gmail.com"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <Mail size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setOtpSent(false);
                    setError('');
                    setInfo('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: portal.themeColor,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <Lock size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.75rem', background: portal.themeColor }} 
              disabled={otpLoading}
            >
              {otpLoading ? 'Authorizing...' : `Sign In to ${portal.title}`}
            </button>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Need a new account?</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setOtpSent(false);
                  setError('');
                  setInfo('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: portal.themeColor,
                  cursor: 'pointer',
                  fontWeight: 700,
                  textDecoration: 'underline'
                }}
              >
                Sign Up Now
              </button>
            </div>
          </form>
        )}

        {/* Workspace Portal Selector - moved to the very bottom of the panel */}
        {!forgotMode && (
          <div style={{
            display: 'flex',
            background: 'rgba(0,0,0,0.2)',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.03)',
            marginTop: '1.5rem'
          }}>
            {['Citizen', 'Staff', 'Admin'].map((tab) => {
              const isSel = activeTab === tab;
              const color = tab === 'Citizen' ? 'var(--color-primary)' : tab === 'Staff' ? 'var(--color-warning)' : 'var(--color-secondary)';
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setError('');
                    setInfo('');
                  }}
                  style={{
                    flex: 1,
                    background: isSel ? color : 'none',
                    color: isSel ? '#000' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.65rem 0.5rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: isSel ? `0 4px 12px ${color}50` : 'none'
                  }}
                >
                  {tab === 'Staff' ? 'Field Staff' : tab === 'Admin' ? 'Authority' : tab}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
