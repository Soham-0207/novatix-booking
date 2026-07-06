import React, { useState } from 'react';
import { User, Mail, ShieldCheck, Edit2, Check, X, Loader2 } from 'lucide-react';

const UserProfile = ({ user, setUser, token }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Password change state
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) return null;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('New passwords do not match!');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Password updated successfully!');
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        alert(data.error || 'Failed to update password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      alert('Network error while updating password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!nameInput.trim() || nameInput.trim() === user.name) {
      setIsEditing(false);
      setNameInput(user.name);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: nameInput.trim() })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Network error while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>My Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your account settings and personal information.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Profile Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'black',
            fontSize: '2rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            flexShrink: 0
          }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <input
                  type="text"
                  className="form-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{ width: '250px', padding: '0.4rem 0.75rem' }}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  disabled={isSaving}
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ background: 'var(--primary)', color: 'black', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: isSaving ? 'not-allowed' : 'pointer' }}
                >
                  {isSaving ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNameInput(user.name);
                  }}
                  disabled={isSaving}
                  style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{user.name}</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Edit Name"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Account Details */}
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} className="gradient-text" />
            Account Information
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Full Name
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} style={{ color: 'var(--primary)' }} />
                {user.name}
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Email Address
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={18} style={{ color: 'var(--secondary)' }} />
                {user.email}
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Change Password */}
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} className="gradient-text" />
            Security
          </h3>
          
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Change Password</h4>
            
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
              <div>
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  disabled={isChangingPassword}
                  required
                />
              </div>
              
              <div>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  disabled={isChangingPassword}
                  required
                  minLength={6}
                />
              </div>
              
              <div>
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  disabled={isChangingPassword}
                  required
                  minLength={6}
                />
              </div>
              
              <button
                type="submit"
                className="btn-primary"
                disabled={isChangingPassword}
                style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isChangingPassword && <Loader2 size={18} className="spin" />}
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
