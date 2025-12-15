import React, { useState, useEffect } from 'react';
import { fetchWaitlist } from '../../api';

const ManageWaitlist = () => {
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await fetchWaitlist();
            setWaitlist(res.data);
        } catch (error) {
            console.error('Failed to load waitlist', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h2>Waitlist Entries</h2>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Court</th>
                            <th>User Name</th>
                            <th>User Email</th>
                            <th>Joined At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {waitlist.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center' }}>No one currently on the waitlist.</td>
                            </tr>
                        ) : (
                            waitlist.map(entry => (
                                <tr key={entry._id}>
                                    <td>{entry.date}</td>
                                    <td>{entry.start_time} - {entry.end_time}</td>
                                    <td>{entry.court ? entry.court.name : 'Any'}</td>
                                    <td>{entry.user_name}</td>
                                    <td>{entry.user_email}</td>
                                    <td>{new Date(entry.created_at).toLocaleString()}</td>
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
