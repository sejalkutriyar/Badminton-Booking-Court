import React, { useEffect, useState } from 'react';
import {
    fetchAdminPricing,
    createPricingRule,
    updatePricing,
    deletePricingRule,
    getErrorMessage,
} from '../../api';
import { formatMoney } from '../../utils/format';

const RULE_META = {
    PEAK_HOUR: { label: 'Peak hour surcharge', unit: 'per hour · 6–9 PM', description: 'Added for hours that overlap the 6–9 PM rush.' },
    WEEKEND: { label: 'Weekend surcharge', unit: 'per hour', description: 'Added on Saturdays and Sundays.' },
    INDOOR: { label: 'Indoor court surcharge', unit: 'per hour', description: 'Added when an indoor court is booked.' },
    COACH: { label: 'Coach fee', unit: 'per hour', description: 'Added when a coach is selected.' },
    EQUIPMENT: { label: 'Equipment rental', unit: 'per item', description: 'Charged once per rented item, not per hour.' },
};

const EMPTY_FORM = { type: 'PEAK_HOUR', value: '', is_active: true };

const ManagePricing = () => {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [isSaving, setIsSaving] = useState(false);

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        let active = true;

        const loadRules = async () => {
            try {
                const res = await fetchAdminPricing();
                if (!active) return;
                setRules(res.data);
                setError(null);
            } catch (err) {
                if (active) setError(getErrorMessage(err, 'Unable to load pricing rules.'));
            } finally {
                if (active) setIsLoading(false);
            }
        };

        loadRules();
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
            const payload = { ...formData, value: Number(formData.value) };
            if (editingId) {
                await updatePricing(editingId, payload);
                setSuccess('Pricing rule updated.');
            } else {
                await createPricingRule(payload);
                setSuccess('Pricing rule added.');
            }
            resetForm();
            reload();
        } catch (err) {
            setError(getErrorMessage(err, 'Could not save the pricing rule.'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (rule) => {
        setEditingId(rule._id);
        setFormData({ type: rule.type, value: rule.value, is_active: rule.is_active });
        setError(null);
        setSuccess(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (rule) => {
        const label = RULE_META[rule.type]?.label || rule.type;
        if (!window.confirm(`Delete the "${label}" rule?`)) return;
        setError(null);
        setSuccess(null);
        try {
            await deletePricingRule(rule._id);
            if (editingId === rule._id) resetForm();
            setSuccess(`${label} deleted.`);
            reload();
        } catch (err) {
            setError(getErrorMessage(err, 'Could not delete the pricing rule.'));
        }
    };

    const selectedMeta = RULE_META[formData.type];

    return (
        <div>
            <h2>Manage Pricing Rules</h2>
            <p className="admin-page-subtitle">
                Every booking starts at a base court fee of {formatMoney(100)} per hour. These rules add surcharges on top.
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
                <h3>{editingId ? 'Edit pricing rule' : 'Add a pricing rule'}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="pricing-type">Rule type</label>
                            <select
                                id="pricing-type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                {Object.entries(RULE_META).map(([value, meta]) => (
                                    <option key={value} value={value}>{meta.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field">
                            <label htmlFor="pricing-value">Surcharge amount (₹)</label>
                            <input
                                id="pricing-value"
                                type="number"
                                placeholder="e.g. 50"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <label className="checkbox-field" htmlFor="pricing-active">
                            <input
                                id="pricing-active"
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            />
                            Apply this rule
                        </label>
                    </div>
                    {selectedMeta && <p className="admin-page-subtitle" style={{ margin: '0.75rem 0 0' }}>{selectedMeta.description}</p>}
                    <div className="admin-form-actions">
                        <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
                            {isSaving ? 'Saving…' : editingId ? 'Update rule' : 'Add rule'}
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
                            <th scope="col">Rule</th>
                            <th scope="col">Amount</th>
                            <th scope="col">Applied to</th>
                            <th scope="col">Status</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="5" className="cell-empty">Loading pricing rules…</td>
                            </tr>
                        ) : rules.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="cell-empty">No pricing rules yet. Base pricing still applies.</td>
                            </tr>
                        ) : (
                            rules.map((rule) => {
                                const meta = RULE_META[rule.type];
                                return (
                                    <tr key={rule._id}>
                                        <td>{meta?.label || rule.type}</td>
                                        <td>{formatMoney(rule.value)}</td>
                                        <td>{meta?.unit || '—'}</td>
                                        <td>
                                            <span className={`pill ${rule.is_active ? 'pill-success' : 'pill-muted'}`}>
                                                {rule.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => handleEdit(rule)}>
                                                    Edit
                                                </button>
                                                <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(rule)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManagePricing;
