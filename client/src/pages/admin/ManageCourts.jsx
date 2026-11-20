import React, { useEffect, useState } from 'react';
import {
    fetchAdminCourts,
    createCourt,
    updateCourt,
    deleteCourt,
    getErrorMessage,
} from '../../api';

const EMPTY_FORM = { name: '', type: 'INDOOR', is_active: true };

const extractCourtNumber = (name) => {
    const match = String(name).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : Infinity;
};

const ManageCourts = () => {
    const [courts, setCourts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        let active = true;

        const loadCourts = async () => {
            try {
                const res = await fetchAdminCourts();
                if (!active) return;
                setCourts(
                    [...res.data].sort((a, b) => extractCourtNumber(a.name) - extractCourtNumber(b.name))
                );
                setError(null);
            } catch (err) {
                if (active) setError(getErrorMessage(err, 'Unable to load courts.'));
            } finally {
                if (active) setIsLoading(false);
            }
        };

        loadCourts();
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
                await updateCourt(editingId, formData);
                setSuccess('Court updated successfully.');
            } else {
                await createCourt(formData);
                setSuccess('Court added successfully.');
            }
            resetForm();
            reload();
        } catch (err) {
            setError(getErrorMessage(err, 'Could not save the court.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (court) => {
        setEditingId(court._id);
        setFormData({ name: court.name, type: court.type, is_active: court.is_active });
        setError(null);
        setSuccess(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (court) => {
        if (!window.confirm(`Delete ${court.name}? This cannot be undone.`)) return;
        setError(null);
        setSuccess(null);
        try {
            await deleteCourt(court._id);
            if (editingId === court._id) resetForm();
            setSuccess(`${court.name} deleted.`);
            reload();
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the court.'));
        }
    };

    return (
        <div>
            <h2>Manage Courts</h2>
            <p className="admin-page-subtitle">
                Add courts, switch them between indoor and outdoor, or take one offline temporarily.
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
                <h3>{editingId ? 'Edit court' : 'Add a new court'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="court-name">Court name</label>
                            <input
                                id="court-name"
                                type="text"
                                placeholder="e.g. Court 1"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="court-type">Court type</label>
                            <select
                                id="court-type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="INDOOR">Indoor</option>
                                <option value="OUTDOOR">Outdoor</option>
                            </select>
                        </div>
                        <label className="checkbox-field" htmlFor="court-active">
                            <input
                                id="court-active"
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            Available for booking
                        </label>
                    </div>
                    <div className="admin-form-actions">
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
                            {isSaving ? 'Saving…' : editingId ? 'Update court' : 'Add court'}
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
                            <th scope="col">Type</th>
                            <th scope="col">Status</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="4" className="cell-empty">Loading courts…</td>
                            </tr>
                        ) : courts.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="cell-empty">No courts yet. Add your first court above.</td>
                            </tr>
                        ) : (
                            courts.map((court) => (
                                <tr key={court._id}>
                                    <td>{court.name}</td>
                                    <td>{court.type === 'INDOOR' ? 'Indoor' : 'Outdoor'}</td>
                                    <td>
                                        <span className={`pill ${court.is_active ? 'pill-success' : 'pill-muted'}`}>
                                            {court.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => handleEdit(court)}>
                                                Edit
                                            </button>
                                            <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(court)}>
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

export default ManageCourts;
