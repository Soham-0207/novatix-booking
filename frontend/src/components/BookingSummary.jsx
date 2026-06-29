import React, { useState, useEffect } from 'react';
import { CreditCard, Timer, ArrowLeft, ShieldCheck } from 'lucide-react';

const BookingSummary = ({
  event,
  selectedSeats,
  isReserved,
  reservationExpiry, // in seconds
  onReserve,
  onRelease,
  onCheckout,
  onBack,
  user,
  openAuthModal,
  processing,
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [paymentData, setPaymentData] = useState({
    cardholder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const ticketPrice = parseFloat(event.ticket_price);
  const totalAmount = ticketPrice * selectedSeats.length;
  const currency = event.currency || '₹';

  // Real-time Countdown Timer for Redis lock
  useEffect(() => {
    if (!isReserved || !reservationExpiry) return;

    setTimeLeft(reservationExpiry);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRelease(); // automatically release on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isReserved, reservationExpiry]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentData.cardholder || !paymentData.cardNumber || !paymentData.expiry || !paymentData.cvv) {
      alert('Please fill out all payment fields (Demo mode: any values work).');
      return;
    }
    onCheckout();
  };

  return (
    <div className="glass-panel fade-in" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--text-main)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={16} />
          <span>Back to events</span>
        </button>

        <h2 style={{ fontSize: '1.6rem', marginBottom: '1.25rem' }}>Booking Summary</h2>

        {/* Selected Seats Details */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 500 }}>Selected Seats</h3>
          {selectedSeats.length === 0 ? (
            <p style={{ color: 'var(--text-dimmed)', fontSize: '0.95rem' }}>No seats selected yet. Click on the seats in the layout.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {selectedSeats.map(seat => (
                <span 
                  key={seat.id}
                  style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid var(--primary)',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                  }}
                >
                  {seat.seat_number}
                </span>
              ))}
            </div>
          )}

          {selectedSeats.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Total Tickets:</span>
              <span style={{ fontWeight: 600 }}>{selectedSeats.length} x {currency}{ticketPrice.toFixed(2)}</span>
            </div>
          )}
          
          {selectedSeats.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Total Price:</span>
              <span className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 800 }}>{currency}{totalAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Reservation Hold & Timer (Redis Phase) */}
        {selectedSeats.length > 0 && isReserved && (
          <div className="pulse-lock" style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid var(--color-reserved)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Timer size={20} color="var(--color-reserved)" />
              <div>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-reserved)', textTransform: 'uppercase' }}>
                  Seats Locked (Redis)
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Complete booking before timeout
                </span>
              </div>
            </div>
            <span style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              color: 'var(--color-reserved)',
            }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </div>

      <div>
        {selectedSeats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-dimmed)', fontSize: '0.9rem' }}>
            Please select at least one seat to continue.
          </div>
        ) : !isReserved ? (
          // Click to Reserve/Hold Seats in Redis
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              <ShieldCheck size={16} color="var(--color-available)" />
              <span>Includes temporary lock to prevent double booking.</span>
            </div>
            {user ? (
              <button className="btn-primary" onClick={onReserve} style={{ width: '100%' }}>
                Lock Seats & Checkout
              </button>
            ) : (
              <button className="btn-primary" onClick={openAuthModal} style={{ width: '100%' }}>
                Sign In to Reserve
              </button>
            )}
          </div>
        ) : (
          // Payment Form (Postgres Transaction Phase)
          <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Demo Payment</h3>
            
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label>Cardholder Name</label>
              <input
                id="cardholder-input"
                type="text"
                name="cardholder"
                required
                className="form-input"
                placeholder="John Doe"
                value={paymentData.cardholder}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label>Card Number</label>
              <input
                id="card-number-input"
                type="text"
                name="cardNumber"
                required
                pattern="\d{16}"
                title="16 digits"
                className="form-input"
                placeholder="4000123456789010"
                value={paymentData.cardNumber}
                onChange={handleInputChange}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Expiry (MM/YY)</label>
                <input
                  id="expiry-input"
                  type="text"
                  name="expiry"
                  required
                  pattern="\d{2}/\d{2}"
                  title="MM/YY format"
                  className="form-input"
                  placeholder="12/28"
                  value={paymentData.expiry}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>CVV</label>
                <input
                  id="cvv-input"
                  type="password"
                  name="cvv"
                  required
                  pattern="\d{3}"
                  title="3 digits"
                  className="form-input"
                  placeholder="***"
                  value={paymentData.cvv}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onRelease}
                disabled={processing}
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Cancel Hold
              </button>
              
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={processing}
                style={{ flex: 2, padding: '0.75rem' }}
              >
                {processing ? (
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Pay & Book</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingSummary;
