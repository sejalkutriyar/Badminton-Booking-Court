import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    fetchAdminCourts,
    fetchAdminCoaches,
    fetchAdminEquipment,
    fetchAdminPricing,
    fetchWaitlist,
    fetchHistory,
    getErrorMessage,
} from '../../api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setError(null);
            try {
                const [courtsRes, coachesRes, equipmentRes, pricingRes, waitlistRes, bookingsRes] =
                    await Promise.all([
                        fetchAdminCourts(),
                        fetchAdminCoaches(),
                        fetchAdminEquipment(),
                        fetchAdminPricing(),
                        fetchWaitlist(),
                        fetchHistory(),
                    ]);

                if (!active) return;

                const bookings = bookingsRes.data;
                const now = new Date();
                const upcoming = bookings.filter((booking) => {
                    if (booking.status !== 'CONFIRMED') return false;
                    const [year, month, day] = booking.date.split('-').map(Number);
                    const [hours, minutes] = booking.start_time.split(':').map(Number);
                    return new Date(year, month - 1, day, hours, minutes) >= now;
                });

                setStats({
                    courts: courtsRes.data.length,
                    activeCourts: courtsRes.data.filter((court) => court.is_active).length,
                    coaches: coachesRes.data.length,
                    activeCoaches: coachesRes.data.filter((coach) => coach.is_active).length,
                    equipment: equipmentRes.data.length,
                    units: equipmentRes.data.reduce((sum, item) => sum + (item.total_quantity || 0), 0),
                    pricingRules: pricingRes.data.length,
                    activeRules: pricingRes.data.filter((rule) => rule.is_active).length,
                    waitlist: waitlistRes.data.filter((entry) => !entry.notified_at).length,
                    upcoming: upcoming.length,
                    totalBookings: bookings.length,
                });
            } catch (err) {
                if (active) setError(getErrorMessage(err, 'Unable to load dashboard data.'));
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [reloadKey]);

    return (
        <div>
            <h2>Admin Dashboard</h2>
            <p className="admin-page-subtitle">
                A quick snapshot of your courts, staff and bookings. Pick a section from the menu to edit.
            </p>

            {error && (
                <div className="banner error-banner" role="alert">
                    <span>{error}</span>
                    <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setReloadKey((key) => key + 1)}>
                        Retry
                    </button>
                </div>
            )}

            {!stats && !error && (
                <div className="stat-grid" aria-hidden="true">
                    {[0, 1, 2, 3].map((item) => (
                        <div className="stat-card" key={item}>
                            <span className="skeleton-line" style={{ width: '45%', height: '1.8rem' }} />
                            <span className="skeleton-line" style={{ width: '70%' }} />
                            <span className="skeleton-line" style={{ width: '55%' }} />
                        </div>
                    ))}
                </div>
            )}

            {stats && (
                <>
                    <div className="stat-grid">
                        <Link to="/admin/courts" className="stat-card">
                            <span className="stat-value">{stats.courts}</span>
                            <span className="stat-label">Courts</span>
                            <span className="stat-hint">{stats.activeCourts} active and bookable</span>
                        </Link>
                        <Link to="/admin/coaches" className="stat-card">
                            <span className="stat-value">{stats.coaches}</span>
                            <span className="stat-label">Coaches</span>
                            <span className="stat-hint">{stats.activeCoaches} available for sessions</span>
                        </Link>
                        <Link to="/admin/equipment" className="stat-card">
                            <span className="stat-value">{stats.equipment}</span>
                            <span className="stat-label">Equipment types</span>
                            <span className="stat-hint">{stats.units} units in inventory</span>
                        </Link>
                        <Link to="/admin/pricing" className="stat-card">
                            <span className="stat-value">{stats.pricingRules}</span>
                            <span className="stat-label">Pricing rules</span>
                            <span className="stat-hint">{stats.activeRules} currently applied</span>
                        </Link>
                        <Link to="/admin/waitlist" className="stat-card">
                            <span className="stat-value">{stats.waitlist}</span>
                            <span className="stat-label">Waitlist entries</span>
                            <span className="stat-hint">Waiting for a slot to open</span>
                        </Link>
                        <Link to="/history" className="stat-card">
                            <span className="stat-value">{stats.upcoming}</span>
                            <span className="stat-label">Upcoming bookings</span>
                            <span className="stat-hint">{stats.totalBookings} bookings recorded</span>
                        </Link>
                    </div>

                    <div className="form-card">
                        <h3>Quick actions</h3>
                        <div className="dashboard-links">
                            <Link to="/admin/courts" className="admin-btn admin-btn-primary">Manage courts</Link>
                            <Link to="/admin/pricing" className="admin-btn admin-btn-ghost">Adjust pricing</Link>
                            <Link to="/admin/equipment" className="admin-btn admin-btn-ghost">Update inventory</Link>
                            <Link to="/history" className="admin-btn admin-btn-ghost">View booking history</Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
