import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';

const ReviewSection = ({ eventId, token, user, openAuthModal }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reviews/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      openAuthModal();
      return;
    }

    setSubmitStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ eventId, rating, comment })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review.');
      }

      setSubmitStatus('success');
      setComment('');
      setRating(5);
      
      // Add the new review to the top of the list immediately
      const newReview = {
        id: data.reviewId,
        user_name: user.name,
        rating,
        comment,
        created_at: new Date().toISOString()
      };
      setReviews([newReview, ...reviews]);

      // Reset success status after a few seconds
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(err.message);
    }
  };

  const renderStars = (count, size = 16, interactive = false) => {
    return (
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            fill={(interactive ? hoverRating || rating : count) >= star ? 'var(--color-selected)' : 'transparent'}
            color={(interactive ? hoverRating || rating : count) >= star ? 'var(--color-selected)' : 'var(--border)'}
            style={{ 
              cursor: interactive ? 'pointer' : 'default',
              transition: 'var(--transition)'
            }}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
      <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MessageSquare size={20} className="gradient-text" />
        <span>Event Reviews</span>
      </h3>

      {/* Write a Review Section */}
      <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Leave a Review</h4>
        {!token ? (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            padding: '1.5rem', 
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border)',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You must be signed in to leave a review.</p>
            <button className="btn-secondary" onClick={openAuthModal}>Sign In to Review</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-dimmed)', marginBottom: '0.5rem' }}>
                Your Rating
              </label>
              {renderStars(rating, 24, true)}
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <textarea
                required
                className="form-input"
                placeholder="Share your thoughts about this event..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            {submitStatus === 'error' && (
              <div style={{ color: 'var(--color-booked)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {errorMessage}
              </div>
            )}
            
            {submitStatus === 'success' && (
              <div style={{ color: 'var(--color-available)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Review submitted successfully!
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={submitStatus === 'loading' || submitStatus === 'success'}
            >
              {submitStatus === 'loading' ? (
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
              ) : (
                <>
                  <Send size={16} />
                  <span>Post Review</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Review List */}
      <div>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          Recent Reviews ({reviews.length})
        </h4>
        
        {loading ? (
          <div className="flex-center" style={{ padding: '2rem 0' }}>
            <div className="spinner"></div>
          </div>
        ) : reviews.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No reviews yet. Be the first to share your experience!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {reviews.map((rev) => (
              <div key={rev.id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{rev.user_name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dimmed)' }}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  {renderStars(rev.rating)}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
