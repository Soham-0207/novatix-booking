import React, { useState, useEffect, useRef } from 'react';
import { Ticket, User, LogOut, Calendar, Menu, X } from 'lucide-react';

const Navbar = ({ user, onLogout, setView, view, openAuthModal }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = (newView) => {
    if (newView === 'create-event' && !user) {
      openAuthModal('login');
      setIsMobileMenuOpen(false);
      setIsProfileMenuOpen(false);
      return;
    }
    setView(newView);
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  return (
    <nav ref={navRef} className="navbar-container" style={{ position: 'relative' }}>
      <div 
        onClick={() => handleLinkClick('events')} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
        }}>
          <img src="/logo.png" alt="NovaTix Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <span 
          className="gradient-text" 
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          NovaTix
        </span>
      </div>

      <div className="nav-links">
        <button
          className="hide-on-mobile"
          onClick={() => handleLinkClick('events')}
          style={{
            background: 'none',
            border: 'none',
            color: view === 'events' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: view === 'events' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'var(--transition)',
          }}
        >
          Events
        </button>

        <button
          className="hide-on-mobile"
          onClick={() => handleLinkClick('create-event')}
          style={{
            background: 'none',
            border: 'none',
            color: view === 'create-event' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: view === 'create-event' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'var(--transition)',
            marginLeft: '0.5rem',
          }}
        >
          Host an Event
        </button>

        <div className="nav-divider" style={{
          height: '20px',
          width: '1px',
          backgroundColor: 'var(--border)',
          margin: '0 0.5rem',
        }} />

        {/* Desktop User Block */}
        {user ? (
          <div className="user-block-mobile hide-on-mobile" style={{ position: 'relative' }}>
            <div 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <User size={16} className="gradient-text" />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {user.name}
              </span>
            </div>

            {/* Desktop Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="mobile-menu slide-up" style={{ width: '200px', top: '120%', right: 0 }}>
                <button
                  onClick={() => handleLinkClick('my-bookings')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: view === 'my-bookings' ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: view === 'my-bookings' ? '600' : '500',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <Ticket size={18} />
                  My Tickets
                </button>
                <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--border)' }} />
                <button
                  onClick={() => {
                    onLogout();
                    setIsProfileMenuOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-booked)',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hide-on-mobile" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                openAuthModal('login');
                setIsMobileMenuOpen(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-main)'}
            >
              Sign in
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                openAuthModal('signup');
                setIsMobileMenuOpen(false);
              }}
              style={{
                padding: '0.5rem 1.2rem',
                fontSize: '0.9rem',
              }}
            >
              Sign up
            </button>
          </div>
        )}

        {/* Mobile Toggle Button */}
        <button 
          className="nav-toggle-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : (user ? <User size={24} className="gradient-text" /> : <Menu size={24} />)}
        </button>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="mobile-menu slide-up">
            <button
              onClick={() => handleLinkClick('events')}
              style={{
                background: 'none',
                border: 'none',
                color: view === 'events' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: view === 'events' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <Calendar size={18} />
              Events
            </button>

            <button
              onClick={() => handleLinkClick('create-event')}
              style={{
                background: 'none',
                border: 'none',
                color: view === 'create-event' ? 'var(--primary)' : 'var(--text-main)',
                fontWeight: view === 'create-event' ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '0.5rem'
              }}
            >
              <Ticket size={18} />
              Host an Event
            </button>

            {user ? (
              <>
                <button
                  onClick={() => handleLinkClick('my-bookings')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: view === 'my-bookings' ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: view === 'my-bookings' ? '600' : '500',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <Ticket size={18} />
                  My Tickets
                </button>
                <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--border)' }} />
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Signed in as <strong>{user.name}</strong>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-booked)',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--border)' }} />
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <User size={18} />
                  Sign in
                </button>
                <button
                  onClick={() => {
                    openAuthModal('signup');
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--bg-card)',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginTop: '0.5rem'
                  }}
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
