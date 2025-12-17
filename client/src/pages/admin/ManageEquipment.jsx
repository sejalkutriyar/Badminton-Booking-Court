import React, { useState, useEffect } from 'react';
import { fetchAdminEquipment, createEquipment, updateEquipment, deleteEquipment } from '../../api';

const ManageEquipment = () => {
    const [equipment, setEquipment] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', total_quantity: '' });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadEquipment();
    }, []);

    const loadEquipment = async () => {
        try {
            const res = await fetchAdminEquipment();
            setEquipment(res.data);
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
                await updateEquipment(editingId, { ...formData, total_quantity: parseInt(formData.total_quantity) || 0 });
                setSuccess('Equipment updated successfully');
            } else {
                await createEquipment({ ...formData, total_quantity: parseInt(formData.total_quantity) || 0 });
                setSuccess('Equipment added successfully');
            }
            setFormData({ name: '', total_quantity: '' });
            setEditingId(null);
            loadEquipment();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleEdit = (item) => {
        setEditingId(item._id);
        setFormData({ name: item.name, total_quantity: item.total_quantity });
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await deleteEquipment(id);
            setSuccess('Equipment deleted');
            loadEquipment();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: '', total_quantity: '' });
    };

    return (
        <div>
            <h2>Manage Equipment</h2>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

            <div className="form-card">
                <h3>{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <input
                            type="text"
                            placeholder="Equipment Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Data Quantity"
                            value={formData.total_quantity}
                            onChange={e => setFormData({ ...formData, total_quantity: e.target.value })}
                            min="0"
                            required
                        />
                    </div>
                    <div className="admin-actions">
                        <button type="submit" className="btn-primary">
                            {editingId ? 'Update Equipment' : 'Add Equipment'}
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
                        <th>Total Quantity</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {equipment.map(item => (
                        <tr key={item._id}>
                            <td>{item.name}</td>
                            <td>{item.total_quantity}</td>
                            <td className="admin-actions">
                                <button onClick={() => handleEdit(item)}>Edit</button>
                                <button className="btn-danger" onClick={() => handleDelete(item._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManageEquipment;
