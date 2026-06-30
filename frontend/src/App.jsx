import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import EventList from './components/EventList.jsx';
import SeatMap from './components/SeatMap.jsx';
import BookingSummary from './components/BookingSummary.jsx';
import AuthModal from './components/AuthModal.jsx';
import UserBookings from './components/UserBookings.jsx';
import ContactPage from './components/ContactPage.jsx';
import ReviewSection from './components/ReviewSection.jsx';
import AboutPage from './components/AboutPage.jsx';
import FooterPages from './components/FooterPages.jsx';
import Footer from './components/Footer.jsx';
import CreateEvent from './components/CreateEvent.jsx';
import confetti from 'canvas-confetti';
import { AlertCircle, CheckCircle2, Info, MapPin, Hourglass } from 'lucide-react';

const App = () => {
  // Navigation & Views
  const [view, setView] = useState('events'); // 'events', 'my-bookings', 'contact'
  
  const handleNavClick = async (newView) => {
    if (isReserved) {
      await handleReleaseSeats();
    } else {
      resetBookingState();
      setSelectedEvent(null);
    }
    setView(newView);
    window.history.pushState({ view: newView }, '', '');
  };


  // Auth state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Events & Booking state
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Redis hold state
  const [isReserved, setIsReserved] = useState(false);
  const [reservationExpiry, setReservationExpiry] = useState(0);
  const [reservedByMe, setReservedByMe] = useState([]); // Array of seat IDs

  // UI state
  const [toasts, setToasts] = useState([]);
  const [processing, setProcessing] = useState(false);

  // Listen to browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e) => {
      // Release any holds if they go back
      if (isReserved) handleReleaseSeats();
      resetBookingState();

      if (e.state && e.state.eventId) {
        const evt = events.find(ev => ev.id === e.state.eventId);
        setSelectedEvent(evt || null);
        setView('events');
      } else if (e.state && e.state.view) {
        setSelectedEvent(null);
        setView(e.state.view);
      } else {
        // Initial state
        setSelectedEvent(null);
        setView('events');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [events, isReserved, reservedByMe, selectedEvent, token]);

  // Load User Profile on mount/token change
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const profile = await response.json();
          setUser(profile);
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    };

    fetchProfile();
  }, [token]);

  // Handle Password Reset Links
  const [resetToken, setResetToken] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenStr = params.get('reset');
    if (tokenStr) {
      setResetToken(tokenStr);
      setAuthModalMode('reset-password');
      setAuthModalOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Load Events
  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (err) {
      showToast('Error loading events.', 'error');
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch seat layouts for the active event (called on view active and periodically polled)
  const fetchSeats = async (eventId, silent = false) => {
    if (!silent) setSeatsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/events/${eventId}/seats`);
      if (response.ok) {
        const data = await response.json();
        setSeats(data);
        
        // Concurrency check: If a seat currently selected by the user is booked/reserved by someone else, release it
        if (selectedSeats.length > 0) {
          const updatedSelected = selectedSeats.filter(selSeat => {
            const currentSeatState = data.find(s => s.id === selSeat.id);
            if (!currentSeatState) return false;

            // If it is permanently booked, or reserved by another user
            const isBooked = currentSeatState.status === 'booked';
            const isReservedByOther = currentSeatState.status === 'reserved' && 
                                      currentSeatState.reserved_by !== (user?.id) &&
                                      !reservedByMe.includes(selSeat.id);
            
            if (isBooked || isReservedByOther) {
              showToast(`Seat ${selSeat.seat_number} is no longer available.`, 'info');
              return false;
            }
            return true;
          });

          if (updatedSelected.length !== selectedSeats.length) {
            setSelectedSeats(updatedSelected);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching seat layout:', err);
    } finally {
      if (!silent) setSeatsLoading(false);
    }
  };

  // Poll seats layout when selectedEvent is active and user is not holding a confirmed reservation
  useEffect(() => {
    if (!selectedEvent || isReserved) return;

    fetchSeats(selectedEvent.id);

    const interval = setInterval(() => {
      fetchSeats(selectedEvent.id, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedEvent, isReserved, selectedSeats, user]);

  // Authentication handlers
  const handleAuthSuccess = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    showToast(`Welcome back, ${userData.name}!`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setView('events');
    resetBookingState();
    window.history.pushState({ view: 'events' }, '', '');
    showToast('Signed out successfully.', 'info');
  };

  // Seat toggle selection
  const handleToggleSeat = (seat) => {
    if (isReserved) return; // Can't change seats once Redis lock is active

    setSelectedSeats((prev) => {
      const exists = prev.some(s => s.id === seat.id);
      if (exists) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  // Reset local booking hold details
  const resetBookingState = () => {
    setSelectedSeats([]);
    setIsReserved(false);
    setReservationExpiry(0);
    setReservedByMe([]);
  };

  // A. Temporary Reserve Seats (Redis Hold)
  const handleReserveSeats = async () => {
    if (!token) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const seatIds = selectedSeats.map(s => s.id);
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bookings/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: selectedEvent.id, seatIds }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsReserved(true);
        setReservationExpiry(data.expiresIn);
        setReservedByMe(seatIds);
        showToast('Seats reserved! Complete payment in 5 mins.', 'success');
      } else {
        showToast(data.error || 'Seat locking failed.', 'error');
        // Refresh seat layout immediately
        fetchSeats(selectedEvent.id);
      }
    } catch (err) {
      showToast('Error reserving seats.', 'error');
    }
  };

  // B. Cancel/Release Temporary Reserve (Cancel Hold)
  const handleReleaseSeats = async () => {
    if (!token || !selectedEvent || reservedByMe.length === 0) {
      resetBookingState();
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bookings/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: selectedEvent.id, seatIds: reservedByMe }),
      });
    } catch (err) {
      console.error('Error releasing seats:', err);
    } finally {
      resetBookingState();
      showToast('Reservation released.', 'info');
      // Refresh seat layout
      fetchSeats(selectedEvent.id);
    }
  };

  // C. Confirm Checkout (Postgres Transaction & Permanent Booking)
  const handleCheckout = async () => {
    if (!token || !selectedEvent || selectedSeats.length === 0) return;

    setProcessing(true);
    try {
      const seatIds = selectedSeats.map(s => s.id);
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/bookings/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: selectedEvent.id, seatIds }),
      });

      const data = await response.json();

      if (response.ok) {
        // Confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        showToast('Booking Confirmed! Enjoy your event.', 'success');
        resetBookingState();
        setSelectedEvent(null);
        fetchEvents(); // reload event counts
        setView('my-bookings'); // show user tickets
        window.history.pushState({ view: 'my-bookings' }, '', '');
      } else {
        showToast(data.error || 'Booking failed.', 'error');
      }
    } catch (err) {
      showToast('Network error during booking checkout.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Toast System
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <div className="app-container">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        setView={handleNavClick} 
        view={view} 
        openAuthModal={(mode = 'login') => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }} 
      />

      <main className="content-container">
        {/* View Switcher */}
        {view === 'contact' ? (
          <ContactPage token={token} user={user} />
        ) : view === 'about' ? (
          <AboutPage />
        ) : view === 'create-event' ? (
          <CreateEvent token={token} />
        ) : ['features', 'pricing', 'security', 'roadmap', 'careers', 'blog', 'documentation', 'api-reference', 'community', 'privacy-policy', 'terms-of-service', 'cookie-policy'].includes(view) ? (
          <FooterPages view={view} />
        ) : view === 'my-bookings' ? (
          <UserBookings token={token} />
        ) : selectedEvent ? (
          // Seat Map / Booking View
          <div className="fade-in">
            {/* Header banner */}
            <div className="glass-panel" style={{
              padding: '1.5rem 2rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <div>
                <span className="gradient-text" style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Booking Seats For
                </span>
                <h1 style={{ fontSize: '1.8rem', marginTop: '0.2rem' }}>{selectedEvent.title}</h1>
                {selectedEvent.duration_hours && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    <Hourglass size={14} />
                    <span>Duration: {selectedEvent.duration_hours} Hours</span>
                  </div>
                )}
              </div>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedEvent.venue)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Get directions on Google Maps"
              >
                <MapPin size={16} />
                <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>{selectedEvent.venue}</span>
              </a>
            </div>

            {/* Layout Split: Seat Map Grid & Checkout Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
              gap: '2rem',
              alignItems: 'start',
            }}>
              {seatsLoading ? (
                <div className="glass-panel flex-center" style={{ minHeight: '400px', flexDirection: 'column', gap: '1rem' }}>
                  <div className="spinner" />
                  <p style={{ color: 'var(--text-muted)' }}>Preparing visual seat layout...</p>
                </div>
              ) : (
                <SeatMap 
                  seats={seats} 
                  selectedSeats={selectedSeats} 
                  onToggleSeat={handleToggleSeat}
                  currentUserId={user?.id}
                  reservedByMe={reservedByMe}
                />
              )}

              <BookingSummary
                event={selectedEvent}
                selectedSeats={selectedSeats}
                isReserved={isReserved}
                reservationExpiry={reservationExpiry}
                onReserve={handleReserveSeats}
                onRelease={handleReleaseSeats}
                onCheckout={handleCheckout}
                onBack={() => {
                  if (isReserved) handleReleaseSeats();
                  resetBookingState();
                  setSelectedEvent(null);
                  window.history.pushState({ view: 'events' }, '', '');
                }} // cancels hold if they go back
                user={user}
                openAuthModal={() => setAuthModalOpen(true)}
                processing={processing}
              />
            </div>

            {/* Review Section */}
            <ReviewSection 
              eventId={selectedEvent.id} 
              token={token} 
              user={user} 
              openAuthModal={() => setAuthModalOpen(true)} 
            />
          </div>
        ) : (
          // Event Catalog
          <EventList 
            events={events} 
            onSelectEvent={(event) => {
              if (isReserved) handleReleaseSeats();
              resetBookingState();
              setSelectedEvent(event);
              window.history.pushState({ eventId: event.id }, '', '');
            }} 
            loading={eventsLoading}
          />
        )}
      </main>

      {/* Footer */}
      <Footer setView={handleNavClick} />

      {/* Auth Modal overlay */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        resetToken={resetToken}
      />

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} color="var(--color-available)" />}
            {toast.type === 'error' && <AlertCircle size={18} color="var(--color-booked)" />}
            {toast.type === 'info' && <Info size={18} color="var(--color-selected)" />}
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
