import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHistory, cancelBooking, clearHistory, getErrorMessage } from '../api';
import { formatDate, formatTimeRange, formatMoney, isPastBooking } from '../utils/format';
import './HistoryPage.css';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'cancelled', label: 'Cancelled' },
];

const HistoryPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [filter, setFilter] = useState('all');
    const [isClearing, setIsClearing] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);
    const [banner, setBanner] = useState(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError(null);

        fetchHistory()
            .then((res) => {
                if (!active) return;
                setBookings(res.data);
            })
            .catch((err) => {
                if (active) setLoadError(getErrorMessage(err, 'Could not load your bookings.'));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [reloadKey]);

    useEffect(() => {
        if (!banner) return undefined;
        const timer = setTimeout(() => setBanner(null), 4000);
        return () => clearTimeout(timer);
    }, [banner]);

    const withState = useMemo(() => {
        const now = new Date();
        return bookings.map((booking) => ({
            ...booking,
            isPast: isPastBooking(booking, now),
            isCancelled: booking.status === 'CANCELLED',
        }));
    }, [bookings]);

    const counts = useMemo(() => ({
        all: withState.length,
        upcoming: withState.filter((booking) => !booking.isCancelled && !booking.isPast).length,
        past: withState.filter((booking) => !booking.isCancelled && booking.isPast).length,
        cancelled: withState.filter((booking) => booking.isCancelled).length,
    }), [withState]);

    const visibleBookings = useMemo(() => {
        if (filter === 'upcoming') return withState.filter((booking) => !booking.isCancelled && !booking.isPast);
        if (filter === 'past') return withState.filter((booking) => !booking.isCancelled && booking.isPast);
        if (filter === 'cancelled') return withState.filter((booking) => booking.isCancelled);
        return withState;
    }, [withState, filter]);

    const handleClear = async () => {
        const confirmed = window.confirm('Clear ALL booking history? This permanently deletes every booking and cannot be undone.');
        if (!confirmed) return;

        setIsClearing(true);
        setBanner(null);

        try {
            await clearHistory();
            setBookings([]);
            setFilter('all');
            setBanner({ type: 'success', message: 'Booking history cleared.' });
        } catch (err) {
            setBanner({ type: 'error', message: getErrorMessage(err, 'Could not clear booking history.') });
        } finally {
            setIsClearing(false);
        }
    };

    const handleCancel = async (booking) => {
        const confirmed = window.confirm(
            `Cancel ${booking.court?.name || 'this booking'} on ${formatDate(booking.date)} at ${formatTimeRange(booking.start_time, booking.end_time)}?`
        );
        if (!confirmed) return;

        setCancellingId(booking._id);
        setBanner(null);

        try {
            await cancelBooking(booking._id);
            setBookings((prev) =>
                prev.map((item) => (item._id === booking._id ? { ...item, status: 'CANCELLED' } : item))
            );
            setBanner({ type: 'success', message: 'Booking cancelled. The slot is available again.' });
        } catch (err) {
            setBanner({ type: 'error', message: getErrorMessage(err, 'Could not cancel the booking.') });
        } finally {
            setCancellingId(null);
        }
    };

    const galleryEmpty = (() => {
        if (filter === 'upcoming') return 'You have no upcoming bookings.';
        if (filter === 'past') return 'No past bookings yet.';
        if (filter === 'cancelled') return 'No cancelled bookings yet.';
        return 'No bookings found yet.';
    })();

    return (
        <div className="page-container history-page">
            <header className="page-heading">
                <div>
                    <h2>Your Bookings</h2>
                    <p className="page-subtitle">
                        {bookings.length === 0
                            ? 'Your court reservations will appear here.'
                            : `${counts.upcoming} upcoming · ${counts.past} past · ${counts.cancelled} cancelled`}
                    </p>
                </div>
                <Link to="/" className="ghost-link">Book a court</Link>
            </header>

            {banner && (
                <div className={`banner ${banner.type === 'success' ? 'success-banner' : 'error-banner'}`} role={banner.type === 'error' ? 'alert' : 'status'}>
                    <div><span>{banner.message}</span></div>
                    <button type="button" className="banner-close" aria-label="Dismiss message" onClick={() => setBanner(null)}>
                        ×
                    </button>
                </div>
            )}

            {loading ? (
                <div>
                    <div className="loading-state" role="status">
                        <span className="spinner" aria-hidden="true" />
                        Loading your bookings…
                    </div>
                    <div className="bookings-grid" aria-hidden="true">
                        {[0, 1, 2].map((index) => (
                            <div key={index} className="booking-card skeleton-card">
                                <div className="skeleton-line long" />
                                <div className="skeleton-line medium" />
                                <div className="skeleton-line short" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : loadError ? (
                <div className="empty-state">
                    <p>{loadError}</p>
                    <button type="button" className="btn-primary" onClick={() => setReloadKey((key) => key + 1)}>
                        Try again
                    </button>
                </div>
            ) : bookings.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-icon" aria-hidden="true">🏸</span>
                    <p>No bookings yet.</p>
                    <p className="empty-hint">Pick a court, choose a time and your booking will show up here.</p>
                    <Link to="/" className="btn-primary">Book a court</Link>
                </div>
            ) : (
                <>
                    <div className="history-toolbar">
                        <div className="filter-tabs" aria-label="Filter bookings">
                            {FILTERS.map((item) => (
                                <button
                                    type="button"
                                    key={item.id}
                                    className={`filter-tab ${filter === item.id ? 'active' : ''}`}
                                    aria-pressed={filter === item.id}
                                    onClick={() => setFilter(item.id)}
                                >
                                    {item.label}
                                    <span className="filter-count">{counts[item.id]}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="btn-danger-outline"
                            onClick={handleClear}
                            disabled={isClearing}
                        >
                            {isClearing ? 'Clearing…' : 'Clear history'}
                        </button>
                    </div>

                    {visibleBookings.length === 0 ? (
                        <div className="empty-state compact">
                            <p>{galleryEmpty}</p>
                            {filter !== 'all' && (
                                <button type="button" className="btn-ghost" onClick={() => setFilter('all')}>
                                    Show all bookings
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bookings-grid">
                            {visibleBookings.map((booking) => {
                                const canCancel = !booking.isCancelled && !booking.isPast;
                                const equipmentItems = (booking.equipment || [])
                                    .filter((line) => line.item)
                                    .map((line) => `${line.item.name} ×${line.quantity}`)
                                    .join(', ');

                                return (
                                    <article
                                        key={booking._id}
                                        className={`booking-card ${booking.isCancelled ? 'is-cancelled' : ''} ${booking.isPast ? 'is-past' : ''}`}
                                    >
                                        <div className="booking-header">
                                            <div className="booking-when">
                                                <span className="booking-date">{formatDate(booking.date)}</span>
                                                <span className="booking-time">{formatTimeRange(booking.start_time, booking.end_time)}</span>
                                            </div>
                                            <span className={`status ${booking.status.toLowerCase()}${!booking.isCancelled && booking.isPast ? ' completed' : ''}`}>
                                                {booking.status === 'CANCELLED' ? 'Cancelled' : booking.isPast ? 'Completed' : 'Confirmed'}
                                            </span>
                                        </div>

                                        <div className="booking-info">
                                            <div className="info-row">
                                                <span className="info-label">Court</span>
                                                <span>{booking.court ? booking.court.name : 'Court removed'}</span>
                                            </div>
                                            {booking.coach && (
                                                <div className="info-row">
                                                    <span className="info-label">Coach</span>
                                                    <span>{booking.coach.name}</span>
                                                </div>
                                            )}
                                            {equipmentItems && (
                                                <div className="info-row">
                                                    <span className="info-label">Equipment</span>
                                                    <span className="info-value">{equipmentItems}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="booking-footer">
                                            <div className="booking-total">
                                                <span>Total</span>
                                                <strong>{formatMoney(booking.total_price)}</strong>
                                            </div>
                                            {canCancel && (
                                                <button
                                                    type="button"
                                                    className="btn-danger"
                                                    onClick={() => handleCancel(booking)}
                                                    disabled={cancellingId === booking._id}
                                                >
                                                    {cancellingId === booking._id ? 'Cancelling…' : 'Cancel booking'}
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default HistoryPage;
