import React, { useEffect, useState } from 'react';
import {
    fetchAdminCoaches,
    createCoach,
    updateCoach,
    deleteCoach,
    getErrorMessage,
} from '../../api';

const EMPTY_FORM = { name: '', is_active: true };

const ManageCoaches = () => {
    const [coaches, setCoaches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        let active = true;

        const loadCoaches = async () => {
            try {
                const res = await fetchAdminCoaches();
                if (!active) return;
                setCoaches([...res.data].sort((a, b) => a.name.localeCompare(b.name)));
                setError(null);
            } catch (err) {
                if (active) setError(getErrorMessage(err, 'Unable to load coaches.'));
            } finally {
                if (active) setIsLoading(false);
            }
        };

        loadCoaches();
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
            if (editingId) {
                await updateCoach(editingId, formData);
                setSuccess('Coach updated successfully.');
            } else {
                await createCoach(formData);
                setSuccess('Coach added successfully.');
            }
            resetForm();
            reload();
        } catch (err) {
            setError(getErrorMessage(err, 'Could not save the coach.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (coach) => {
        setEditingId(coach._id);
        setFormData({ name: coach.name, is_active: coach.is_active });
        setError(null);
        setSuccess(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (coach) => {
        if (!window.confirm(`Delete ${coach.name}? This cannot be undone.`)) return;
        setError(null);
        setSuccess(null);
        try {
            await deleteCoach(coach._id);
            if (editingId === coach._id) resetForm();
            setSuccess(`${coach.name} deleted.`);
            reload();
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the coach.'));
        }
    };

    return (
        <div>
            <h2>Manage Coaches</h2>
            <p className="admin-page-subtitle">
                Keep the coaching roster current. Inactive coaches stay in past bookings but cannot be selected.
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
                <h3>{editingId ? 'Edit coach' : 'Add a new coach'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="coach-name">Coach name</label>
                            <input
                                id="coach-name"
                                type="text"
                                placeholder="e.g. Priya Sharma"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <label className="checkbox-field" htmlFor="coach-active">
                            <input
                                id="coach-active"
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            Available for coaching
                        </label>
                    </div>
                    <div className="admin-form-actions">
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
                            {isSaving ? 'Saving…' : editingId ? 'Update coach' : 'Add coach'}
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
                            <th scope="col">Status</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="3" className="cell-empty">Loading coaches…</td>
                            </tr>
                        ) : coaches.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="cell-empty">No coaches yet. Add your first coach above.</td>
                            </tr>
                        ) : (
                            coaches.map((coach) => (
                                <tr key={coach._id}>
                                    <td>{coach.name}</td>
                                    <td>
                                        <span className={`pill ${coach.is_active ? 'pill-success' : 'pill-muted'}`}>
                                            {coach.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => handleEdit(coach)}>
                                                Edit
                                            </button>
                                            <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(coach)}>
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

export default ManageCoaches;
