import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, User, HelpCircle } from 'lucide-react';

const ContactPage = ({ token, user }) => {
  const [formData, setFormData] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    subject: '',
    message: ''
  });
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/contact`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit message.');
      }

      setStatus('success');
      setFormData({
        name: user ? user.name : '',
        email: user ? user.email : '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="fade-in" style={{ padding: '2rem 0', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Customer Care</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>We're here to help! Send us your questions, feedback, or concerns.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Contact Info Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem', borderRadius: '50%' }}>
                <HelpCircle size={24} className="gradient-text" />
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>Need Quick Help?</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Check out our Help Center for answers to frequently asked questions about booking limits, refund policies, and event schedules.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem', borderRadius: '50%' }}>
                <MessageSquare size={24} className="gradient-text" />
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>Direct Support</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Our support team typically replies within 24 hours. Fill out the form to get in touch with a real human.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
          {status === 'success' ? (
            <div className="fade-in" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <CheckCircle2 size={48} color="var(--color-available)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Message Received!</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                Thank you for reaching out. Our team will get back to you at {formData.email || 'your email'} shortly.
              </p>
              <button className="btn-secondary" onClick={() => setStatus('idle')} style={{ width: '100%', justifyContent: 'center' }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="fade-in">
              <div className="form-group">
                <label>Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dimmed)' }} />
                  <input
                    type="text"
                    name="name"
                    required
                    disabled={!!user}
                    className="form-input"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.8rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dimmed)' }} />
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={!!user}
                    className="form-input"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.8rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subject</label>
                <div style={{ position: 'relative' }}>
                  <MessageSquare size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dimmed)' }} />
                  <input
                    type="text"
                    name="subject"
                    required
                    className="form-input"
                    placeholder="What is this regarding?"
                    value={formData.subject}
                    onChange={handleChange}
                    style={{ paddingLeft: '2.8rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  name="message"
                  required
                  className="form-input"
                  placeholder="How can we help you today?"
                  value={formData.message}
                  onChange={handleChange}
                  style={{ minHeight: '120px', resize: 'vertical' }}
                />
              </div>

              {status === 'error' && (
                <div style={{ color: 'var(--color-booked)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {errorMessage}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={status === 'loading'}
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                {status === 'loading' ? (
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
