import React, { useState, useEffect } from 'react';
import { fetchAdminCourts, createCourt, updateCourt, deleteCourt } from '../../api';

const ManageCourts = () => {
    const [courts, setCourts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', type: 'INDOOR', is_active: true });

    // Notification state
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadCourts();
    }, []);

    const loadCourts = async () => {
        try {
            const res = await fetchAdminCourts();
            // Sort courts numerically
            const sorted = res.data.sort((a, b) => {
                const extractNum = (name) => {
                    const match = name.match(/(\d+)/);
                    return match ? parseInt(match[0], 10) : Infinity;
                };
                return extractNum(a.name) - extractNum(b.name);
            });
            setCourts(sorted);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            if (editingId) {
                await updateCourt(editingId, formData);
                setSuccess('Court updated successfully');
            } else {
                await createCourt(formData);
                setSuccess('Court created successfully');
            }
            setFormData({ name: '', type: 'INDOOR', is_active: true });
            setEditingId(null);
            loadCourts();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleEdit = (court) => {
        setEditingId(court._id);
        setFormData({ name: court.name, type: court.type, is_active: court.is_active });
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await deleteCourt(id);
            setSuccess('Court deleted');
            loadCourts();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', type: 'INDOOR', is_active: true });
    };

    return (
        <div>
            <h2>Manage Courts</h2>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

            <div className="form-card">
                <h3>{editingId ? 'Edit Court' : 'Add New Court'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Court Name (e.g. Court A)"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="INDOOR">Indoor</option>
                            <option value="OUTDOOR">Outdoor</option>
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                style={{ marginRight: '5px' }}
                            />
                            Active
                        </label>
                    </div>
                    <div className="admin-actions">
                        <button type="submit" className="btn-primary">
                            {editingId ? 'Update Court' : 'Add Court'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancel}>Cancel</button>
                        )}
                    </div>
                </form>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {courts.map(court => (
                        <tr key={court._id}>
                            <td>{court.name}</td>
                            <td>{court.type}</td>
                            <td>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: court.is_active ? '#d4edda' : '#f8d7da',
                                    color: court.is_active ? '#155724' : '#721c24'
                                }}>
                                    {court.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="admin-actions">
                                <button onClick={() => handleEdit(court)}>Edit</button>
                                <button className="btn-danger" onClick={() => handleDelete(court._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageCourts;
