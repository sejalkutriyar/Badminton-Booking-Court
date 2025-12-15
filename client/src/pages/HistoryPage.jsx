import React, { useState, useEffect } from 'react';
import { fetchHistory, cancelBooking, clearHistory } from '../api';
import './HistoryPage.css';
import { format } from 'date-fns';

const HistoryPage = () => {
    const [bookings, setBookings] = useState([]);
    const [isClearing, setIsClearing] = useState(false);
    const [banner, setBanner] = useState(null); // { type: 'success'|'error', message: '' }

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const res = await fetchHistory();
            setBookings(res.data);
        } catch (err) {
            console.error('Failed to load history', err);
        }
    };

    const handleClear = async () => {
        const ok = window.confirm('Are you sure you want to clear ALL booking history? This cannot be undone.');
        if (!ok) return;
        try {
            setIsClearing(true);
            setBanner(null);
            const res = await clearHistory();
            if (res && res.data && res.data.deletedCount >= 0) {
                setBookings([]);
                setBanner({ type: 'success', message: 'Booking history cleared.' });
            } else {
                setBanner({ type: 'error', message: 'Failed to clear history.' });
            }
        } catch (err) {
            console.error('Clear history failed', err);
            setBanner({ type: 'error', message: err?.response?.data?.error || err.message || 'Failed to clear history.' });
        } finally {
            setIsClearing(false);
            setTimeout(() => setBanner(null), 3000);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Cancel this booking?')) return;
        try {
            await cancelBooking(id);
            setBanner({ type: 'success', message: 'Booking cancelled.' });
            loadHistory(); // Reload
        } catch (err) {
            setBanner({ type: 'error', message: err.response?.data?.error || 'Cancellation failed' });
        } finally {
            setTimeout(() => setBanner(null), 3000);
        }
    };

    return (
        <div className="page-container history-page">
            <h2>Your Bookings</h2>

            {banner && (
                <div className={banner.type === 'success' ? 'success-banner' : 'error-banner'}>
                    {banner.message}
                </div>
            )}

            {bookings.length > 0 && (
                <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                    <button className="btn-primary" disabled={isClearing} onClick={handleClear}>
                        {isClearing ? 'Clearing...' : 'Clear History'}
                    </button>
                </div>
            )}

            {bookings.length === 0 ? (
                <div className="empty-state">
                    <p>No bookings found yet.</p>
                    <a href="/" className="cta-link">Book a Court</a>
                </div>
            ) : (
                <div className="bookings-grid">
                    {bookings.map(booking => (
                        <div key={booking._id} className="booking-card">
                            <div className="booking-header">
                                <span className="booking-date">
                                    {format(new Date(booking.date), 'MMM dd, yyyy')}
                                </span>
                                <span className={`status ${booking.status.toLowerCase()}`}>
                                    {booking.status}
                                </span>
                            </div>

                            <div className="booking-info">
                                <div className="info-row">
                                    <span className="info-label">Time:</span>
                                    <span>{booking.start_time} - {booking.end_time}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Court:</span>
                                    <span>{booking.court ? booking.court.name : 'Unknown Court'}</span>
                                </div>
                                {booking.coach && (
                                    <div className="info-row">
                                        <span className="info-label">Coach:</span>
                                        <span>{booking.coach.name}</span>
                                    </div>
                                )}
                                {booking.equipment && booking.equipment.length > 0 && (
                                    <div className="items-list">
                                        <strong>Extras: </strong>
                                        {booking.equipment.map((e, idx) => (
                                            <span key={idx}>
                                                {e.item ? e.item.name : 'Item'} (x{e.quantity})
                                                {idx < booking.equipment.length - 1 ? ', ' : ''}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="booking-footer">
                                <span className="total-price">₹{booking.total_price}</span>
                                <button
                                    style={{
                                        marginLeft: '10px',
                                        backgroundColor: '#e74c3c',
                                        color: 'white',
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleCancel(booking._id)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
