import React from 'react';
import { User, Mail, ShieldCheck } from 'lucide-react';

const UserProfile = ({ user }) => {
  if (!user) return null;

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
            textTransform: 'uppercase'
          }}>
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{user.name}</h2>
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

      </div>
    </div>
  );
};

export default UserProfile;
