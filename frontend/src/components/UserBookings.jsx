import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Ticket, CreditCard, ChevronRight } from 'lucide-react';

const UserBookings = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bookings/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }
        const data = await response.json();
        setBookings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token]);

  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
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
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Booked Tickets</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage and view details for all your purchased event tickets.</p>
      </div>

      {bookings.length === 0 ? (
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
        <div style={{ display: 'flex', flexHorizontal: 'false', flexDirection: 'column', gap: '1.5rem' }}>
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
                      <span>{formatDate(booking.event_date)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <MapPin size={14} className="gradient-text" />
                      <span>{booking.event_venue}</span>
                    </div>
                  </div>

                  {/* Booked Seats List */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dimmed)', textTransform: 'uppercase', fontWeight: 600 }}>Seats:</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
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
                    <span>Transaction Total: <strong style={{ color: 'var(--text-main)' }}>₹{parseFloat(booking.total_amount).toFixed(2)}</strong></span>
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
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-10px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border)',
                  zIndex: 2,
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: '-10px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border)',
                  zIndex: 2,
                }} />

                <div style={{
                  background: 'white',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  marginBottom: '0.75rem',
                  width: '70px',
                  height: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* Mock QR Code representation */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'radial-gradient(black 3px, transparent 3px), radial-gradient(black 3px, transparent 3px)',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 0, 5px 5px',
                  }} />
                </div>
                
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dimmed)', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  ID: {booking.booking_id.substring(0, 8)}
                </span>
                
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--color-available)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  CONFIRMED
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserBookings;
