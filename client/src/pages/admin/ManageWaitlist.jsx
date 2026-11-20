import React, { useEffect, useState } from 'react';
import { fetchWaitlist, getErrorMessage } from '../../api';
import { formatDate, formatTimeRange } from '../../utils/format';

const ManageWaitlist = () => {
    const [waitlist, setWaitlist] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        const loadData = async () => {
            try {
                const res = await fetchWaitlist();
                if (!active) return;
                setWaitlist(res.data);
                setError(null);
            } catch (err) {
                if (active) setError(getErrorMessage(err, 'Unable to load the waitlist.'));
            } finally {
                if (active) setIsLoading(false);
            }
        };

        loadData();
        return () => {
            active = false;
        };
    }, [reloadKey]);

    const refresh = () => {
        setIsLoading(true);
        setReloadKey((key) => key + 1);
    };

    const waitingCount = waitlist.filter((entry) => !entry.notified_at).length;

    return (
        <div>
            <h2>Waitlist</h2>
            <p className="admin-page-subtitle">
                {waitingCount} player{waitingCount === 1 ? '' : 's'} waiting for a slot to open
                {waitlist.length > waitingCount ? ` · ${waitlist.length - waitingCount} already notified` : ''}.
            </p>

            {error && (
                <div className="banner error-banner" role="alert">
                    <span>{error}</span>
                    <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={refresh}>
                        Retry
                    </button>
                </div>
            )}

            <div className="admin-form-actions" style={{ marginTop: 0, marginBottom: '1rem' }}>
                <button type="button" className="admin-btn admin-btn-ghost" onClick={refresh} disabled={isLoading}>
                    {isLoading ? 'Refreshing…' : 'Refresh list'}
                </button>
            </div>

            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Time</th>
                            <th scope="col">Court</th>
                            <th scope="col">Player</th>
                            <th scope="col">Email</th>
                            <th scope="col">Status</th>
                            <th scope="col">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="7" className="cell-empty">Loading waitlist…</td>
                            </tr>
                        ) : waitlist.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="cell-empty">No one is on the waitlist right now.</td>
                            </tr>
                        ) : (
                            waitlist.map((entry) => (
                                <tr key={entry._id}>
                                    <td>{formatDate(entry.date)}</td>
                                    <td>{formatTimeRange(entry.start_time, entry.end_time)}</td>
                                    <td>{entry.court ? entry.court.name : 'Any court'}</td>
                                    <td>{entry.user_name}</td>
                                    <td>{entry.user_email}</td>
                                    <td>
                                        <span className={`pill ${entry.notified_at ? 'pill-info' : 'pill-success'}`}>
                                            {entry.notified_at ? 'Notified' : 'Waiting'}
                                        </span>
                                    </td>
                                    <td>{new Date(entry.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageWaitlist;
