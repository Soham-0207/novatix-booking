import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = 'login', resetToken = null }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'forgot-password', 'reset-password'
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Clear form state every time the modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', email: '', password: '' });
      setError('');
      setSuccessMsg('');
    } else {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (password) => {
    if (!password) return '';
    if (password.length < 6) return 'Low';
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 1) return 'Low';
    if (score === 2) return 'Medium';
    return 'High';
  };

  const strength = (mode === 'signup' || mode === 'reset-password') ? getPasswordStrength(formData.password) : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if ((mode === 'signup' || mode === 'reset-password') && strength === 'Low') {
      setError('Password is too weak. Please use a stronger password (Medium or High).');
      return;
    }

    setLoading(true);

    const baseUrl = import.meta.env.VITE_API_URL || '';
    
    try {
      if (mode === 'forgot-password') {
        const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send reset email');
        setSuccessMsg(data.message || 'Check your email for the reset link!');
        setFormData({ ...formData, email: '' });
      } 
      else if (mode === 'reset-password') {
        const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword: formData.password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to reset password');
        
        setSuccessMsg(data.message || 'Password reset successful!');
        setTimeout(() => {
          setMode('login');
          setSuccessMsg('');
          setFormData({ name: '', email: '', password: '' });
        }, 2000);
      }
      else {
        // Login or Signup
        const url = mode === 'login' ? `${baseUrl}/api/auth/login` : `${baseUrl}/api/auth/register`;
        const payload = mode === 'login' 
          ? { email: formData.email, password: formData.password }
          : { name: formData.name, email: formData.email, password: formData.password };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          if (data.code === 'USER_NOT_FOUND' && mode === 'login') {
            setMode('signup');
            setFormData({ ...formData, password: '' });
            setError('This email is not registered. We have switched you to Sign Up so you can create an account!');
            setLoading(false);
            return;
          }

          if (data.code === 'USER_EXISTS' && mode === 'signup') {
            setMode('login');
            setFormData({ ...formData, password: '' });
            setError('This email already has an account! Please sign in instead.');
            setLoading(false);
            return;
          }

          throw new Error(data.error || 'Authentication failed');
        }

        onAuthSuccess(data.token, data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStrengthIndicator = () => {
    if ((mode !== 'signup' && mode !== 'reset-password') || !formData.password) return null;

    let color = 'var(--text-muted)';
    let icon = <Shield size={14} />;
    
    if (strength === 'Low') {
      color = 'var(--color-booked)'; 
      icon = <ShieldAlert size={14} />;
    } else if (strength === 'Medium') {
      color = 'var(--color-selected)'; 
      icon = <Shield size={14} />;
    } else if (strength === 'High') {
      color = 'var(--color-available)'; 
      icon = <ShieldCheck size={14} />;
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color, marginTop: '0.5rem' }}>
        {icon}
        <span>Password Strength: <strong>{strength}</strong></span>
      </div>
    );
  };

  const renderHeader = () => {
    switch (mode) {
      case 'login': return { title: 'Welcome Back', subtitle: 'Sign in to reserve and book seats' };
      case 'signup': return { title: 'Create Account', subtitle: 'Register to get started with booking' };
      case 'forgot-password': return { title: 'Reset Password', subtitle: 'Enter your email to receive a reset link' };
      case 'reset-password': return { title: 'New Password', subtitle: 'Enter your new secure password below' };
      default: return { title: '', subtitle: '' };
    }
  };

  const header = renderHeader();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div 
        className="glass-panel fade-in auth-modal-inner"
        style={{
          width: '90%',
          maxWidth: '400px',
          padding: '2.5rem 2rem',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-dimmed)',
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--text-main)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-dimmed)'}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          {header.title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
          {header.subtitle}
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-booked)',
            color: 'var(--text-main)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--color-available)',
            color: 'var(--text-main)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dimmed)' }} />
                <input
                  type="text"
                  name="name"
                  required
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '2.8rem' }}
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'forgot-password') && (
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dimmed)' }} />
                <input
                  type="email"
                  name="email"
                  required
                  className="form-input"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '2.8rem' }}
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'reset-password') && (
            <div className="form-group" style={{ marginBottom: mode === 'login' ? '1rem' : '2rem' }}>
              <label>{mode === 'reset-password' ? 'New Password' : 'Password'}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dimmed)' }} />
                <input
                  type="password"
                  name="password"
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '2.8rem' }}
                />
              </div>
              {renderStrengthIndicator()}
            </div>
          )}

          {mode === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot-password');
                  setError('');
                  setSuccessMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dimmed)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-dimmed)'}
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '0.8rem', justifyContent: 'center', marginTop: mode === 'forgot-password' ? '1rem' : '0' }}
          >
            {loading ? (
              <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
            ) : (
              <span>
                {mode === 'login' ? 'Sign In' : 
                 mode === 'signup' ? 'Sign Up' : 
                 mode === 'forgot-password' ? 'Send Reset Link' : 
                 'Reset Password'}
              </span>
            )}
          </button>
        </form>

        {(mode === 'login' || mode === 'signup') && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setSuccessMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </div>
        )}

        {mode === 'forgot-password' && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
            <button
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              &larr; Back to Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
