import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Ticket, CreditCard, ChevronRight } from 'lucide-react';

const UserBookings = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('tickets');
  const [hostedEvents, setHostedEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, hostedRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || ''}/api/bookings/user`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL || ''}/api/events/hosted`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
        ]);

        if (!bookingsRes.ok || !hostedRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const bookingsData = await bookingsRes.json();
        const hostedData = await hostedRes.json();
        
        setBookings(bookingsData);
        setHostedEvents(hostedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const formatDate = (dateString, timezone = 'UTC') => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: timezone };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Fetching your tickets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel flex-center" style={{ padding: '3rem 2rem', flexDirection: 'column', gap: '1rem', color: 'var(--color-booked)' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your purchased tickets and hosted events.</p>
        </div>
        
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '0.3rem', borderRadius: 'var(--radius-full)' }}>
          <button 
            onClick={() => setActiveTab('tickets')}
            style={{ 
              padding: '0.5rem 1.5rem', 
              borderRadius: 'var(--radius-full)', 
              background: activeTab === 'tickets' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'tickets' ? 'var(--bg-main)' : 'var(--text-main)',
              fontWeight: activeTab === 'tickets' ? '600' : '400',
              border: 'none',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            My Tickets
          </button>
          <button 
            onClick={() => setActiveTab('hosted')}
            style={{ 
              padding: '0.5rem 1.5rem', 
              borderRadius: 'var(--radius-full)', 
              background: activeTab === 'hosted' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'hosted' ? 'var(--bg-main)' : 'var(--text-main)',
              fontWeight: activeTab === 'hosted' ? '600' : '400',
              border: 'none',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            Hosted Events
          </button>
        </div>
      </div>

      {activeTab === 'tickets' && (
        bookings.length === 0 ? (
          <div className="glass-panel flex-center" style={{ padding: '5rem 2rem', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              padding: '1.5rem',
              borderRadius: '50%',
              color: 'var(--primary)',
            }}>
              <Ticket size={48} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No tickets booked yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>You haven't reserved or booked tickets to any upcoming events yet.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {bookings.map((booking) => (
              <div 
                key={booking.booking_id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  position: 'relative',
                }}
              >
                {/* Left Ticket Hub (Main Details) */}
                <div style={{
                  padding: '1.5rem 2rem',
                  flex: 3,
                  borderRight: '2px dashed var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{booking.event_title}</h3>
                    
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Calendar size={14} className="gradient-text" />
                        <span>{formatDate(booking.event_date, booking.event_timezone)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <MapPin size={14} className="gradient-text" />
                        <span>{booking.event_venue}</span>
                      </div>
                    </div>

                    {/* Booked Seats List */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 600 }}>Seats:</span>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {booking.booked_seats.split(', ').map((seatNum) => (
                          <span 
                            key={seatNum}
                            style={{
                              backgroundColor: 'rgba(0, 242, 254, 0.1)',
                              border: '1px solid var(--accent)',
                              color: 'var(--text-main)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                            }}
                          >
                            {seatNum}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)' }}>
                      Booked on {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <CreditCard size={14} />
                      <span>Transaction Total: <strong style={{ color: 'var(--text-main)' }}>{booking.event_currency || '₹'}{parseFloat(booking.total_amount).toFixed(2)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Ticket Stub (Barcode/Summary) */}
                <div style={{
                  flex: 1,
                  padding: '1.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.01)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  position: 'relative',
                }}>
                  {/* Decorative Half-circle ticket cuts */}
                  <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', zIndex: 2 }} />
                  <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)', zIndex: 2 }} />

                  <div style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.75rem', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '100%', height: '100%', backgroundImage: 'radial-gradient(black 3px, transparent 3px), radial-gradient(black 3px, transparent 3px)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 5px 5px' }} />
                  </div>
                  
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dimmed)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                    ID: {booking.booking_id.substring(0, 8)}
                  </span>
                  
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-available)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    CONFIRMED
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'hosted' && (
        hostedEvents.length === 0 ? (
          <div className="glass-panel flex-center" style={{ padding: '5rem 2rem', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
            <div style={{
              background: 'rgba(0, 242, 254, 0.1)',
              padding: '1.5rem',
              borderRadius: '50%',
              color: 'var(--accent)',
            }}>
              <Calendar size={48} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No events hosted yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>You haven't published any events on NovaTix.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {hostedEvents.map((event) => (
              <div 
                key={event.id}
                className="glass-panel"
                style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{event.title}</h3>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={14} /> {formatDate(event.date)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Users size={14} /> {event.total_seats} Seats Total</span>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Security Deposit Status</div>
                    {event.deposit_status === 'refunded' ? (
                      <span style={{ display: 'inline-block', padding: '0.3rem 0.8rem', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--color-available)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        Refunded (Minus Comm.)
                      </span>
                    ) : event.deposit_status === 'held' ? (
                      <span style={{ display: 'inline-block', padding: '0.3rem 0.8rem', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        Held ({event.currency}{event.deposit_amount})
                      </span>
                    ) : (
                      <span style={{ display: 'inline-block', padding: '0.3rem 0.8rem', background: 'rgba(156, 163, 175, 0.1)', color: 'var(--text-muted)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        N/A
                      </span>
                    )}
                  </div>
                </div>
                
                {event.deposit_status === 'held' && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #fbbf24', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Your security deposit of <strong>{event.currency}{event.deposit_amount}</strong> is currently held. It will be returned to you (minus a 10% platform commission) after the event date has passed.
                  </div>
                )}
                {event.deposit_status === 'refunded' && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--color-available)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Your security deposit of <strong>{event.currency}{event.deposit_amount}</strong> has been successfully refunded. 
                    <br/>Refund Details: {event.currency}{event.deposit_amount} - {event.currency}{(event.deposit_amount * 0.1).toFixed(2)} (10% Commission) = <strong>{event.currency}{(event.deposit_amount * 0.9).toFixed(2)} Refunded</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default UserBookings;
