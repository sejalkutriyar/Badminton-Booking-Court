import React, { useState, useEffect } from 'react';
import { fetchAdminCoaches, createCoach, updateCoach, deleteCoach } from '../../api';

const ManageCoaches = () => {
    const [coaches, setCoaches] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', is_active: true });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadCoaches();
    }, []);

    const loadCoaches = async () => {
        try {
            const res = await fetchAdminCoaches();
            setCoaches(res.data);
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
                await updateCoach(editingId, formData);
                setSuccess('Coach updated successfully');
            } else {
                await createCoach(formData);
                setSuccess('Coach added successfully');
            }
            setFormData({ name: '', is_active: true });
            setEditingId(null);
            loadCoaches();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleEdit = (coach) => {
        setEditingId(coach._id);
        setFormData({ name: coach.name, is_active: coach.is_active });
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await deleteCoach(id);
            setSuccess('Coach deleted');
            loadCoaches();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', is_active: true });
    };

    return (
        <div>
            <h2>Manage Coaches</h2>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

            <div className="form-card">
                <h3>{editingId ? 'Edit Coach' : 'Add New Coach'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Coach Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
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
                            {editingId ? 'Update Coach' : 'Add Coach'}
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
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {coaches.map(coach => (
                        <tr key={coach._id}>
                            <td>{coach.name}</td>
                            <td>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: coach.is_active ? '#d4edda' : '#f8d7da',
                                    color: coach.is_active ? '#155724' : '#721c24'
                                }}>
                                    {coach.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="admin-actions">
                                <button onClick={() => handleEdit(coach)}>Edit</button>
                                <button className="btn-danger" onClick={() => handleDelete(coach._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageCoaches;
