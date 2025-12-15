import React, { useState, useEffect } from 'react';
import { fetchAdminPricing, createPricingRule, updatePricing, deletePricingRule } from '../../api';

const ManagePricing = () => {
    const [rules, setRules] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        type: 'PEAK_HOUR',
        value: 0,
        is_active: true
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        try {
            const res = await fetchAdminPricing();
            setRules(res.data);
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
                await updatePricing(editingId, formData);
                setSuccess('Rule updated successfully');
            } else {
                await createPricingRule(formData);
                setSuccess('Rule created successfully');
            }
            setFormData({ type: 'PEAK_HOUR', value: 0, is_active: true });
            setEditingId(null);
            loadRules();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleEdit = (rule) => {
        setEditingId(rule._id);
        setFormData({ type: rule.type, value: rule.value, is_active: rule.is_active });
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await deletePricingRule(id);
            setSuccess('Rule deleted');
            loadRules();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ type: 'PEAK_HOUR', value: 0, is_active: true });
    };

    return (
        <div>
            <h2>Manage Pricing Rules</h2>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

            <div className="form-card">
                <h3>{editingId ? 'Edit Pricing Rule' : 'Add New Pricing Rule'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="PEAK_HOUR">Peak Hour (6-9 PM)</option>
                            <option value="WEEKEND">Weekend</option>
                            <option value="INDOOR">Indoor Court Premium</option>
                            <option value="COACH">Coach Fee</option>
                            <option value="EQUIPMENT">Equipment Fee (Per Item)</option>
                        </select>
                        <input
                            type="number"
                            placeholder="Price Value (₹)"
                            value={formData.value}
                            onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
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
                            {editingId ? 'Update Rule' : 'Add Rule'}
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
                        <th>Rule Type</th>
                        <th>Price Value (Add-on)</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rules.map(rule => (
                        <tr key={rule._id}>
                            <td>{rule.type}</td>
                            <td>₹{rule.value}</td>
                            <td>
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: rule.is_active ? '#d4edda' : '#f8d7da',
                                    color: rule.is_active ? '#155724' : '#721c24'
                                }}>
                                    {rule.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="admin-actions">
                                <button onClick={() => handleEdit(rule)}>Edit</button>
                                <button className="btn-danger" onClick={() => handleDelete(rule._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ManagePricing;
