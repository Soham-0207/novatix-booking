import React, { useState } from 'react';
import { Calendar, MapPin, Search, Clock, Hourglass } from 'lucide-react';

const EventList = ({ events, onSelectEvent, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortOrder, setSortOrder] = useState('none');

  const categories = ['All Categories', ...new Set(events.map(e => e.category || 'Uncategorized'))];

  // Map parent categories to their subcategories
  const categoryGroups = {
    'Entertainment': ['Entertainment', 'Music', 'Theater & Arts', 'Arts & Culture']
  };

  let filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = false;
    if (selectedCategory === 'All Categories') {
      matchesCategory = true;
    } else if (event.category === selectedCategory) {
      matchesCategory = true;
    } else if (categoryGroups[selectedCategory] && categoryGroups[selectedCategory].includes(event.category)) {
      matchesCategory = true;
    }

    return matchesSearch && matchesCategory;
  });

  const nowForSort = new Date();
  const getIsPast = (dateStr) => {
    const d = new Date(dateStr);
    return d < nowForSort && d.toDateString() !== nowForSort.toDateString();
  };

  filteredEvents.sort((a, b) => {
    const pastA = getIsPast(a.date) ? 1 : 0;
    const pastB = getIsPast(b.date) ? 1 : 0;
    
    // Always put past events at the end
    if (pastA !== pastB) {
      return pastA - pastB;
    }

    if (sortOrder === 'price-asc') {
      return parseFloat(a.ticket_price) - parseFloat(b.ticket_price);
    } else if (sortOrder === 'price-desc') {
      return parseFloat(b.ticket_price) - parseFloat(a.ticket_price);
    } else {
      // Sort by popularity (most tickets sold)
      const soldA = parseInt(a.total_seats) - parseInt(a.available_seats);
      const soldB = parseInt(b.total_seats) - parseInt(b.available_seats);
      return soldB - soldA;
    }
  });

  const formatDate = (dateString, timezone = 'UTC') => {
    const options = { 
      weekday: 'short', month: 'short', day: 'numeric',
      timeZone: timezone
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const formatTime = (dateString, timezone = 'UTC') => {
    const options = { 
      hour: '2-digit', minute: '2-digit', 
      timeZone: timezone
    };
    return new Date(dateString).toLocaleTimeString('en-US', options);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading amazing events...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div 
        className="filter-bar-responsive"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Upcoming Events</h1>
          <p style={{ color: 'var(--text-muted)' }}>Discover and book tickets to the most anticipated live events.</p>
        </div>

        <div 
          className="filter-controls-responsive"
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {/* Category Filter */}
          <select
            className="form-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: 'auto',
              minWidth: '160px',
              cursor: 'pointer',
              appearance: 'none',
              background: 'var(--bg-card) url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 1rem top 50%',
              backgroundSize: '0.65rem auto',
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Price Sort */}
          <select
            className="form-input"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              width: 'auto',
              minWidth: '160px',
              cursor: 'pointer',
              appearance: 'none',
              background: 'var(--bg-card) url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 1rem top 50%',
              backgroundSize: '0.65rem auto',
            }}
          >
            <option value="none">Sort: Default</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          {/* Search Box */}
          <div style={{
            position: 'relative',
            maxWidth: '300px',
            flex: 1,
          }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dimmed)',
            }} />
            <input
              id="event-search-input"
              type="text"
              className="form-input"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: '2.8rem',
              }}
            />
          </div>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="glass-panel flex-center" style={{ padding: '4rem 2rem', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No events found matching your search.</p>
          <button className="btn-secondary" onClick={() => setSearchTerm('')}>Clear Search</button>
        </div>
      ) : (
        <div className="grid-events">
          {filteredEvents.map((event) => {
            const eventDate = new Date(event.date);
            const now = new Date();
            
            // Check if event is in the past (yesterday or older)
            const isPast = eventDate < now && eventDate.toDateString() !== now.toDateString();

            const isToday = eventDate.toDateString() === now.toDateString();
            const isSoldOut = parseInt(event.available_seats) === 0;

            return (
              <div 
                key={event.id} 
                className="glass-panel" 
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'var(--transition)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onClick={() => onSelectEvent(event)}
              >
                {/* Image Section */}
                <div style={{
                  height: '180px',
                  width: '100%',
                  background: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url(${event.image_url}) no-repeat center/cover`,
                  position: 'relative',
                }}>
                  {/* Status Badge (Live or Upcoming) */}
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    display: 'flex',
                    gap: '0.5rem',
                  }}>
                    {isPast ? (
                      <span style={{
                        background: 'rgba(107, 114, 128, 0.9)', // Gray for Finished
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      }}>
                        Finished
                      </span>
                    ) : isToday ? (
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.9)', // Red for Live
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}>
                        <span style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                        LIVE
                      </span>
                    ) : (
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.9)', // Green for Upcoming
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      }}>
                        Upcoming
                      </span>
                    )}
                  </div>

                  {isSoldOut ? (
                    <span style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'var(--color-booked)',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                    }}>
                      Sold Out
                    </span>
                  ) : (
                    <span style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(4px)',
                      color: 'var(--accent)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                    }}>
                      {event.available_seats} left
                    </span>
                  )}
                </div>

                {/* Content Section */}
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      color: 'var(--primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginBottom: '0.75rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} />
                        <span>{formatDate(event.date, event.timezone)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dimmed)' }}>
                        <Clock size={14} />
                        <span>{formatTime(event.date, event.timezone)}</span>
                        {event.duration_hours && (
                          <>
                            <span style={{ margin: '0 0.25rem', opacity: 0.5 }}>•</span>
                            <Hourglass size={14} />
                            <span>{event.duration_hours}h</span>
                          </>
                        )}
                      </div>
                    </div>

                    <h2 style={{
                      fontSize: '1.35rem',
                      marginBottom: '0.75rem',
                      lineHeight: 1.3,
                    }}>
                      {event.title}
                    </h2>

                    <p style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {event.description}
                    </p>

                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.venue)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-dimmed)',
                        fontSize: '0.85rem',
                        marginBottom: '1.5rem',
                        textDecoration: 'none',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dimmed)'}
                      onClick={(e) => e.stopPropagation()}
                      title="Get directions on Google Maps"
                    >
                      <MapPin size={14} />
                      <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>{event.venue}</span>
                    </a>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '1rem',
                    marginTop: 'auto',
                  }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dimmed)', textTransform: 'uppercase' }}>
                        Ticket Price
                      </span>
                      <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        ₹{parseFloat(event.ticket_price).toFixed(2)}
                      </span>
                    </div>

                    <button 
                      className="btn-primary" 
                      disabled={isPast || isSoldOut}
                      style={{
                        padding: '0.5rem 1.2rem',
                        fontSize: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        opacity: isPast ? 0.6 : 1,
                      }}
                    >
                      {isPast ? 'Ended' : isSoldOut ? 'Sold Out' : 'Select Seats'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventList;
