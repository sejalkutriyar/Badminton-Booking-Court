import React, { useEffect, useState } from 'react';
import {
    fetchAdminEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getErrorMessage,
} from '../../api';

const EMPTY_FORM = { name: '', total_quantity: '' };

const ManageEquipment = () => {
    const [equipment, setEquipment] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        let active = true;

        const loadEquipment = async () => {
            try {
                const res = await fetchAdminEquipment();
                if (!active) return;
                setEquipment([...res.data].sort((a, b) => a.name.localeCompare(b.name)));
                setError(null);
            } catch (err) {
                if (active) setError(getErrorMessage(err, 'Unable to load equipment.'));
            } finally {
                if (active) setIsLoading(false);
            }
        };

        loadEquipment();
        return () => {
            active = false;
        };
    }, [reloadKey]);

    const reload = () => {
        setIsLoading(true);
        setReloadKey((key) => key + 1);
    };

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSaving(true);
        try {
            const payload = {
                name: formData.name,
                total_quantity: Number(formData.total_quantity),
            };
            if (editingId) {
                await updateEquipment(editingId, payload);
                setSuccess('Equipment updated successfully.');
            } else {
                await createEquipment(payload);
                setSuccess('Equipment added successfully.');
            }
            resetForm();
            reload();
        } catch (err) {
            setError(getErrorMessage(err, 'Could not save the equipment.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item._id);
        setFormData({ name: item.name, total_quantity: item.total_quantity });
        setError(null);
        setSuccess(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Delete ${item.name}? This cannot be undone.`)) return;
        setError(null);
        setSuccess(null);
        try {
            await deleteEquipment(item._id);
            if (editingId === item._id) resetForm();
            setSuccess(`${item.name} deleted.`);
            reload();
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the equipment.'));
        }
    };

    const totalUnits = equipment.reduce((sum, item) => sum + (item.total_quantity || 0), 0);

    return (
        <div>
            <h2>Manage Equipment</h2>
            <p className="admin-page-subtitle">
                {equipment.length} item types · {totalUnits} units available. Quantities limit what players can add to a booking.
            </p>

            {error && (
                <div className="banner error-banner" role="alert">
                    <span>{error}</span>
                    <button type="button" className="banner-close" onClick={() => setError(null)} aria-label="Dismiss error">
                        ×
                    </button>
                </div>
            )}
            {success && (
                <div className="banner success-banner" role="status">
                    <span>{success}</span>
                    <button type="button" className="banner-close" onClick={() => setSuccess(null)} aria-label="Dismiss message">
                        ×
                    </button>
                </div>
            )}

            <div className="form-card">
                <h3>{editingId ? 'Edit equipment' : 'Add new equipment'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="equipment-name">Equipment name</label>
                            <input
                                id="equipment-name"
                                type="text"
                                placeholder="e.g. Racket"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="equipment-quantity">Total quantity</label>
                            <input
                                id="equipment-quantity"
                                type="number"
                                placeholder="e.g. 12"
                                value={formData.total_quantity}
                                onChange={(e) => setFormData({ ...formData, total_quantity: e.target.value })}
                                min="0"
                                step="1"
                                required
                            />
                        </div>
                    </div>
                    <div className="admin-form-actions">
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
                            {isSaving ? 'Saving…' : editingId ? 'Update equipment' : 'Add equipment'}
                        </button>
                        {editingId && (
                            <button type="button" className="admin-btn admin-btn-ghost" onClick={resetForm} disabled={isSaving}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="admin-table-wrap">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Total quantity</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="3" className="cell-empty">Loading equipment…</td>
                            </tr>
                        ) : equipment.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="cell-empty">No equipment yet. Add your first item above.</td>
                            </tr>
                        ) : (
                            equipment.map((item) => (
                                <tr key={item._id}>
                                    <td>{item.name}</td>
                                    <td>
                                        <span className={`pill ${item.total_quantity > 0 ? 'pill-info' : 'pill-muted'}`}>
                                            {item.total_quantity} units
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => handleEdit(item)}>
                                                Edit
                                            </button>
                                            <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(item)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageEquipment;
