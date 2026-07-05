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
    currency: '₹',
    image_url: '',
    is_featured: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Combine date and time for backend
      const dateTime = `${formData.date} ${formData.time}:00`;
      
      if (new Date(dateTime) < new Date()) {
        setError('Event date and time cannot be in the past.');
        setLoading(false);
        return;
      }
      
      const payload = {
        title: formData.title,
        description: formData.description,
        date: dateTime,
        duration_hours: parseInt(formData.duration_hours),
        venue: formData.venue,
        total_seats: parseInt(formData.total_seats),
        ticket_price: parseFloat(formData.ticket_price),
        category: formData.category,
        currency: formData.currency,
        image_url: formData.image_url,
        is_featured: formData.is_featured,
        deposit_amount: 500
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
        currency: '₹',
        image_url: '',
        is_featured: false
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

          <div className="form-group">
            <label>Cover Image (Optional)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input 
                className="form-input" 
                type="text" 
                name="image_url" 
                value={formData.image_url || ''} 
                onChange={handleChange} 
                placeholder="https://example.com/image.jpg or Browse local file" 
                style={{ flex: 1 }}
              />
              <span style={{ color: 'var(--text-muted)' }}>OR</span>
              <label style={{ cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', display: 'inline-block', fontWeight: 500 }}>
                Browse...
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, image_url: reader.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)', marginTop: '0.25rem', display: 'block' }}>Enter a URL, browse a local image, or leave blank for a default image. Note: Local images shouldn't exceed 1MB.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Date</label>
              <input className="form-input" type="date" name="date" value={formData.date} min={new Date().toISOString().split('T')[0]} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Time</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number"
                  className="form-input" 
                  min="1"
                  max="12"
                  value={formData.time ? (() => {
                    let h = parseInt(formData.time.split(':')[0], 10);
                    if (isNaN(h)) return '12';
                    h = h % 12;
                    if (h === 0) h = 12;
                    return h.toString().padStart(2, '0');
                  })() : '12'} 
                  onChange={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (isNaN(val)) val = 12;
                    if (val > 12) val = 12;
                    if (val < 1) val = 1;
                    
                    let m = formData.time ? formData.time.split(':')[1] : '00';
                    let currentAmPm = formData.time && parseInt(formData.time.split(':')[0], 10) < 12 ? 'AM' : 'PM';
                    let h24 = val;
                    if (currentAmPm === 'PM' && val !== 12) h24 += 12;
                    if (currentAmPm === 'AM' && val === 12) h24 = 0;
                    setFormData(prev => ({ ...prev, time: `${h24.toString().padStart(2, '0')}:${m}` }));
                  }}
                  required
                  style={{ padding: '0.5rem', width: '70px', textAlign: 'center' }}
                />
                <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>:</span>
                <input 
                  type="number"
                  className="form-input" 
                  min="0"
                  max="59"
                  value={formData.time ? formData.time.split(':')[1] : '00'}
                  onChange={(e) => {
                    let val = parseInt(e.target.value, 10);
                    if (isNaN(val)) val = 0;
                    if (val > 59) val = 59;
                    if (val < 0) val = 0;
                    
                    let h24 = formData.time ? formData.time.split(':')[0] : '12';
                    setFormData(prev => ({ ...prev, time: `${h24}:${val.toString().padStart(2, '0')}` }));
                  }}
                  required
                  style={{ padding: '0.5rem', width: '70px', textAlign: 'center' }}
                />
                <select 
                  className="form-input" 
                  value={formData.time ? (parseInt(formData.time.split(':')[0], 10) >= 12 ? 'PM' : 'AM') : 'PM'}
                  onChange={(e) => {
                    const ampm = e.target.value;
                    let h24 = formData.time ? parseInt(formData.time.split(':')[0], 10) : 12;
                    let m = formData.time ? formData.time.split(':')[1] : '00';
                    let h12 = h24 % 12;
                    if (h12 === 0) h12 = 12;
                    
                    if (ampm === 'PM' && h12 !== 12) h24 = h12 + 12;
                    else if (ampm === 'PM' && h12 === 12) h24 = 12;
                    else if (ampm === 'AM' && h12 === 12) h24 = 0;
                    else h24 = h12;
                    
                    setFormData(prev => ({ ...prev, time: `${h24.toString().padStart(2, '0')}:${m}` }));
                  }}
                  required
                  style={{ padding: '0.5rem', cursor: 'pointer', appearance: 'none', background: 'var(--bg-card) url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0a0a0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E") no-repeat right 0.5rem top 50%', backgroundSize: '0.65rem auto' }}
                >
                  <option value="" disabled hidden>AM/PM</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
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

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="is_featured" 
              name="is_featured" 
              checked={formData.is_featured} 
              onChange={handleChange} 
              style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', accentColor: 'var(--primary)' }} 
            />
            <label htmlFor="is_featured" style={{ cursor: 'pointer', margin: 0 }}>
              Promote this event at the top of the homepage (+ {formData.currency}1,000.00 marketing fee)
            </label>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid var(--primary)', marginTop: '1rem', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} color="var(--primary)" />
              Security Deposit Required
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              To ensure platform quality, a refundable security deposit of <strong>{formData.currency}500.00</strong> is required to host an event. 
              Refundable post-event, less a 10% platform fee.
              {formData.is_featured && <span> A non-refundable <strong>{formData.currency}1,000.00</strong> marketing fee is also added for promoting your event.</span>}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Card Number</label>
                <input className="form-input" type="text" placeholder="0000 0000 0000 0000" maxLength="19" required />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input className="form-input" type="text" placeholder="MM/YY" maxLength="5" required />
              </div>
              <div className="form-group">
                <label>CVC</label>
                <input className="form-input" type="text" placeholder="123" maxLength="4" required />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
            {loading ? 'Processing Payment...' : `Pay ${formData.currency}${formData.is_featured ? '1,500.00' : '500.00'} & Publish Event`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
