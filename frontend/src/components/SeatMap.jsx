import React from 'react';
import { Armchair, Monitor } from 'lucide-react';

const SeatMap = ({ 
  seats, 
  selectedSeats, 
  onToggleSeat, 
  currentUserId,
  reservedByMe 
}) => {
  
  // Group seats by row (e.g. A, B, C based on seat_number first character)
  const rows = seats.reduce((acc, seat) => {
    const rowLetter = seat.seat_number.charAt(0);
    if (!acc[rowLetter]) acc[rowLetter] = [];
    acc[rowLetter].push(seat);
    return acc;
  }, {});

  const getSeatColor = (seat) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    // Status priority:
    // 1. Booked (Postgres status 'booked')
    if (seat.status === 'booked') {
      return {
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'var(--color-booked)',
        color: 'var(--color-booked)',
        cursor: 'not-allowed',
        label: 'Booked',
      };
    }
    
    // 2. Selected by current user in the current phase (before Redis reserve)
    if (isSelected) {
      return {
        bg: 'rgba(6, 182, 212, 0.2)',
        border: 'var(--color-selected)',
        color: 'var(--color-selected)',
        cursor: 'pointer',
        label: 'Selected',
      };
    }

    // 3. Reserved in Redis
    if (seat.status === 'reserved') {
      const isReservedByCurrentUser = seat.reserved_by === currentUserId || reservedByMe.includes(seat.id);
      
      if (isReservedByCurrentUser) {
        // Locked by current user (active checkout hold)
        return {
          bg: 'rgba(245, 158, 11, 0.2)',
          border: 'var(--color-reserved)',
          color: 'var(--color-reserved)',
          cursor: 'pointer',
          label: 'Your Hold',
          pulse: true,
        };
      } else {
        // Locked by someone else
        return {
          bg: 'rgba(245, 158, 11, 0.05)',
          border: 'rgba(245, 158, 11, 0.3)',
          color: 'rgba(245, 158, 11, 0.4)',
          cursor: 'not-allowed',
          label: 'Reserved',
        };
      }
    }

    // 4. Available
    return {
      bg: 'rgba(34, 197, 94, 0.05)',
      border: 'var(--color-available)',
      color: 'var(--color-available)',
      cursor: 'pointer',
      label: 'Available',
    };
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Screen/Stage Graphic */}
      <div style={{ width: '80%', textAlign: 'center', marginBottom: '3.5rem' }}>
        <div style={{
          height: '6px',
          background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
          borderRadius: '50%',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.6)',
          marginBottom: '0.75rem',
        }} />
        <span style={{
          fontSize: '0.8rem',
          letterSpacing: '0.4em',
          color: 'var(--text-dimmed)',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          Stage / Screen Direction
        </span>
      </div>

      {/* Seat Layout Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', overflowX: 'auto', paddingBottom: '1rem' }}>
        {Object.entries(rows).map(([rowLetter, rowSeats]) => (
          <div 
            key={rowLetter} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '1rem',
              minWidth: 'fit-content',
            }}
          >
            {/* Row Label (Left) */}
            <span style={{
              width: '24px',
              fontWeight: 700,
              color: 'var(--text-dimmed)',
              fontSize: '0.9rem',
            }}>
              {rowLetter}
            </span>

            {/* Row Seats */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {rowSeats
                .sort((a, b) => parseInt(a.seat_number.substring(1)) - parseInt(b.seat_number.substring(1)))
                .map((seat) => {
                const styleObj = getSeatColor(seat);
                const isInteractive = styleObj.cursor === 'pointer';

                return (
                  <button
                    key={seat.id}
                    onClick={() => isInteractive && onToggleSeat(seat)}
                    disabled={!isInteractive}
                    className={styleObj.pulse ? 'pulse-lock' : ''}
                    title={`Seat ${seat.seat_number} - ${styleObj.label}`}
                    style={{
                      width: '40px',
                      height: '40px',
                      background: styleObj.bg,
                      border: `1.5px solid ${styleObj.border}`,
                      color: styleObj.color,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      cursor: styleObj.cursor,
                      transition: 'var(--transition)',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (isInteractive) {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = `0 0 10px ${styleObj.border}`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isInteractive) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <Armchair size={16} style={{ marginBottom: '1px' }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{seat.seat_number.substring(1)}</span>
                  </button>
                );
              })}
            </div>

            {/* Row Label (Right) */}
            <span style={{
              width: '24px',
              textAlign: 'right',
              fontWeight: 700,
              color: 'var(--text-dimmed)',
              fontSize: '0.9rem',
            }}>
              {rowLetter}
            </span>
          </div>
        ))}
      </div>

      {/* Seat Map Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginTop: '2.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border)',
        width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid var(--color-available)', background: 'rgba(34, 197, 94, 0.05)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid var(--color-selected)', background: 'rgba(6, 182, 212, 0.2)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Selected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid var(--color-reserved)', background: 'rgba(245, 158, 11, 0.2)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your Hold (Redis Lock)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Locked by Others</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1.5px solid var(--color-booked)', background: 'rgba(239, 68, 68, 0.15)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sold / Booked</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;
