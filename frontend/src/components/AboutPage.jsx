import React from 'react';
import { ShieldCheck, Zap, Ticket } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="fade-in" style={{ padding: '2rem 0', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>About NovaTix</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
          We are redefining the event booking experience with lightning-fast real-time seat reservations and a premium user experience.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Zap size={32} className="gradient-text" />
          </div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Real-Time Booking</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Our advanced Redis locking system ensures that when you click a seat, it's instantly reserved for you. No more double bookings.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
          <div style={{ background: 'rgba(235, 166, 54, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <ShieldCheck size={32} color="var(--color-reserved)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Secure & Reliable</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Powered by enterprise-grade databases, your tickets and payments are always safe, secure, and instantly verified.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Ticket size={32} color="var(--color-selected)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Premium Events</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Get exclusive access to the hottest tech conferences, legendary rock concerts, and breathtaking classical performances.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '3rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Our Mission</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.8', maxWidth: '600px', margin: '0 auto' }}>
          NovaTix was built from the ground up to solve the most frustrating part of attending an event: getting the tickets. 
          We believe that securing your spot should be as exciting and seamless as the event itself.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
