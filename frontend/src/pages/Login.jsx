import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '../context/GlobalContext';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, ShieldAlert } from 'lucide-react';

const Login = () => {
  const { login, signup, user } = useContext(GlobalContext);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Citizen',
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (isRegister) {
      if (!formData.name || !formData.email || !formData.password) {
        return setError('Please fill all fields');
      }
      const res = await signup(formData.name, formData.email, formData.password, formData.role);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error);
      }
    } else {
      if (!formData.email || !formData.password) {
        return setError('Please fill all fields');
      }
      const res = await login(formData.email, formData.password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error);
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)',
      padding: '1.5rem'
    }}>
      <div className="glass-panel fade-in" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.5rem',
            boxShadow: '0 0 20px var(--color-primary-glow)',
            marginBottom: '1rem'
          }}>
            C
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.25rem' }}>
            {isRegister ? 'Create Citizen Account' : 'Welcome to CivicPulse'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {isRegister ? 'Join the community patrol to fix our streets' : 'Sign in to report and track local issues'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--color-danger)',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <UserIcon size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="citizen@civicpulse.org"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
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
              />
              <Lock size={16} color="var(--text-dark)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Select Role</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <label style={{ 
                  flex: 1, 
                  minWidth: '110px',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  background: formData.role === 'Citizen' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${formData.role === 'Citizen' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  padding: '0.65rem 0.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="Citizen"
                    checked={formData.role === 'Citizen'}
                    onChange={handleChange}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  Citizen
                </label>
                <label style={{ 
                  flex: 1, 
                  minWidth: '110px',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  background: formData.role === 'Staff' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${formData.role === 'Staff' ? '#8b5cf6' : 'var(--border-color)'}`,
                  padding: '0.65rem 0.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="Staff"
                    checked={formData.role === 'Staff'}
                    onChange={handleChange}
                    style={{ accentColor: '#8b5cf6' }}
                  />
                  Working Staff
                </label>
                <label style={{ 
                  flex: 1, 
                  minWidth: '110px',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  background: formData.role === 'Admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${formData.role === 'Admin' ? 'var(--color-secondary)' : 'var(--border-color)'}`,
                  padding: '0.65rem 0.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}>
                  <input
                    type="radio"
                    name="role"
                    value="Admin"
                    checked={formData.role === 'Admin'}
                    onChange={handleChange}
                    style={{ accentColor: 'var(--color-secondary)' }}
                  />
                  Admin
                </label>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {isRegister ? (
              <>
                <UserPlus size={18} />
                <span>Create Account & Earn +10 XP</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </span>{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              padding: 0,
              textDecoration: 'underline'
            }}
          >
            {isRegister ? 'Sign In' : 'Sign Up as Citizen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
