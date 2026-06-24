import React from 'react';
import { Twitter, Linkedin, Github } from 'lucide-react';

const Footer = ({ setView }) => {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '4rem 2rem 2rem',
      background: 'rgba(10, 10, 15, 0.95)',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    }}>
      <div className="footer-grid">
        {/* Column 1: Brand & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            margin: 0,
            background: 'linear-gradient(to right, #ffffff, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            NovaTix
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            The ultimate event booking platform for modern experiences. Fast, secure, and built to scale for your entertainment needs.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>

            <a href="https://www.linkedin.com/in/soham-vora-7209b732b" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', transition: 'color 0.2s', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
              <Linkedin size={18} />
            </a>
            <a href="https://github.com/Soham-0207" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', transition: 'color 0.2s', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
              <Github size={18} />
            </a>
          </div>
        </div>

        {/* Column 2: Product */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-main)', textTransform: 'uppercase' }}>Product</h3>
          <button className="footer-link" onClick={() => setView('features')}>Features</button>
          <button className="footer-link" onClick={() => setView('pricing')}>Pricing</button>
          <button className="footer-link" onClick={() => setView('security')}>Security</button>
          <button className="footer-link" onClick={() => setView('roadmap')}>Roadmap</button>
        </div>

        {/* Column 3: Company */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-main)', textTransform: 'uppercase' }}>Company</h3>
          <button className="footer-link" onClick={() => setView('about')}>About</button>
          <button className="footer-link" onClick={() => setView('careers')}>Careers</button>
          <button className="footer-link" onClick={() => setView('blog')}>Blog</button>
          <button className="footer-link" onClick={() => setView('contact')}>Contact</button>
        </div>

        {/* Column 4: Resources */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-main)', textTransform: 'uppercase' }}>Resources</h3>
          <button className="footer-link" onClick={() => setView('documentation')}>Documentation</button>
          <button className="footer-link" onClick={() => setView('api-reference')}>API Reference</button>
          <button className="footer-link" onClick={() => setView('contact')}>Support</button>
          <button className="footer-link" onClick={() => setView('community')}>Community</button>
        </div>
      </div>

      <div className="footer-bottom">
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} NovaTix. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
