import React, { useState } from 'react';
import { Calendar, MapPin, Users, DollarSign, Clock, Tag } from 'lucide-react';

const CreateEvent = ({ token }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration_hours: 2,
    venue: '',
    total_seats: 50,
    ticket_price: 50,
    category: 'Entertainment',
    currency: '₹'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Combine date and time for backend
      const dateTime = `${formData.date} ${formData.time}:00`;
      
      const payload = {
        title: formData.title,
        description: formData.description,
        date: dateTime,
        duration_hours: parseInt(formData.duration_hours),
        venue: formData.venue,
        total_seats: parseInt(formData.total_seats),
        ticket_price: parseFloat(formData.ticket_price),
        category: formData.category,
        currency: formData.currency
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        duration_hours: 2,
        venue: '',
        total_seats: 50,
        ticket_price: 50,
        category: 'Entertainment',
        currency: '₹'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fade-in flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={40} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: '2rem' }}>Event Published!</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Your event has been successfully created. We have automatically generated the digital seats and tickets. 
          Users can now book tickets from the homepage!
        </p>
        <button className="btn-primary" onClick={() => window.location.href = '/'} style={{ marginTop: '1rem' }}>
          View Events
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Host Your Event</h1>
        <p style={{ color: 'var(--text-muted)' }}>Fill in the details below to publish your event and start selling tickets.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-booked)', borderRadius: 'var(--radius-sm)', color: 'var(--color-booked)', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Event Title</label>
              <input className="form-input" type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Summer Music Festival" />
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <div className="input-with-icon">
                <Tag size={18} className="input-icon" />
                <select className="form-input" name="category" value={formData.category} onChange={handleChange} required style={{ paddingLeft: '2.5rem' }}>
                  <option>Music</option>
                  <option>Technology</option>
                  <option>Arts & Culture</option>
                  <option>Festivals</option>
                  <option>Entertainment</option>
                  <option>Sports</option>
                  <option>Workshops</option>
                  <option>Charity</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" name="description" value={formData.description} onChange={handleChange} rows="3" required placeholder="Tell attendees what to expect..."></textarea>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Date</label>
              <input className="form-input" type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input className="form-input" type="time" name="time" value={formData.time} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Duration (Hours)</label>
              <div className="input-with-icon">
                <Clock size={18} className="input-icon" />
                <input className="form-input" type="number" name="duration_hours" value={formData.duration_hours} onChange={handleChange} required min="1" max="24" style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Venue / Address</label>
            <div className="input-with-icon">
              <MapPin size={18} className="input-icon" />
              <input className="form-input" type="text" name="venue" value={formData.venue} onChange={handleChange} required placeholder="e.g., Central Park Amphitheater, NY" style={{ paddingLeft: '2.5rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Total Seats Available</label>
              <div className="input-with-icon">
                <Users size={18} className="input-icon" />
                <input className="form-input" type="number" name="total_seats" value={formData.total_seats} onChange={handleChange} required min="10" max="1000" style={{ paddingLeft: '2.5rem' }} />
              </div>
            </div>
            
            <div className="form-group">
              <label>Ticket Price & Currency</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select className="form-input" name="currency" value={formData.currency} onChange={handleChange} style={{ width: '80px', padding: '0.5rem', cursor: 'pointer' }}>
                  <option value="₹">₹ INR</option>
                  <option value="$">$ USD</option>
                  <option value="€">€ EUR</option>
                  <option value="£">£ GBP</option>
                </select>
                <div className="input-with-icon" style={{ flex: 1 }}>
                  <span className="input-icon" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {formData.currency}
                  </span>
                  <input className="form-input" type="number" name="ticket_price" value={formData.ticket_price} onChange={handleChange} required min="0" step="0.01" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
            {loading ? 'Creating Event...' : 'Publish Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
