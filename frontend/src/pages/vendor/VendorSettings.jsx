import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const VendorSettings = () => {
    const { shop, setShop, token } = useOutletContext();
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [udyam, setUdyam] = useState('');
    const [minOrder, setMinOrder] = useState('');
    const [freeDeliveryKms, setFreeDeliveryKms] = useState('');
    const [deliveryFeePerKm, setDeliveryFeePerKm] = useState('');
    const [maxDeliveryRange, setMaxDeliveryRange] = useState('');

    useEffect(() => {
        if (shop) {
            setName(shop.name || '');
            setUdyam(shop.udyamNumber || '');
            setMinOrder(shop.deliverySettings?.minOrderAmount || 0);
            setFreeDeliveryKms(shop.deliverySettings?.freeDeliveryKms || 0);
            setDeliveryFeePerKm(shop.deliverySettings?.deliveryFeePerKm || 0);
            setMaxDeliveryRange(shop.deliverySettings?.maxDeliveryRange || 5);
        }
    }, [shop]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/shops/${shop._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    udyamNumber: udyam,
                    deliverySettings: {
                        minOrderAmount: Number(minOrder),
                        freeDeliveryKms: Number(freeDeliveryKms),
                        deliveryFeePerKm: Number(deliveryFeePerKm),
                        maxDeliveryRange: Number(maxDeliveryRange)
                    }
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setShop(updated);
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings');
            }
        } catch (error) {
            alert('Error saving settings');
        }
        setSaving(false);
    };

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Store Settings</h1>
                <p style={{ fontSize: '13px', color: 'var(--v-text-muted)' }}>Manage your profile and delivery rules.</p>
            </div>

            <form onSubmit={handleSave}>
                <div className="v-settings-grid">
                    {/* Profile */}
                    <div className="v-card">
                        <div className="v-card-header">
                            <div className="v-card-title">Profile Info</div>
                        </div>
                        <div className="v-card-body">
                            <div className="v-field" style={{ marginBottom: '16px' }}>
                                <label className="v-label">Store Name</label>
                                <input className="v-input" required value={name} disabled style={{ backgroundColor: 'var(--v-bg-body)', cursor: 'not-allowed', color: 'var(--v-text-muted)' }} title="Please contact Admin to change store name" />
                            </div>
                            <div className="v-field" style={{ marginBottom: '16px' }}>
                                <label className="v-label">Udyam Number (Optional)</label>
                                <input className="v-input" placeholder="For verification badge" value={udyam} onChange={e => setUdyam(e.target.value)} />
                            </div>
                            <div className="v-field" style={{ marginBottom: '16px' }}>
                                <label className="v-label">Banner Image</label>
                                <div style={{ fontSize: '12px', color: 'var(--v-text-muted)', marginBottom: '8px' }}>
                                    Currently, banners are managed via the admin panel.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Rules */}
                    <div className="v-card">
                        <div className="v-card-header">
                            <div className="v-card-title">Delivery Rules</div>
                        </div>
                        <div className="v-card-body">
                            <div className="v-grid-2" style={{ marginBottom: '16px' }}>
                                <div className="v-field">
                                    <label className="v-label">Min Order (₹)</label>
                                    <input type="number" className="v-input" value={minOrder} onChange={e => setMinOrder(e.target.value)} />
                                </div>
                                <div className="v-field">
                                    <label className="v-label">Max Range (km)</label>
                                    <input type="number" className="v-input" value={maxDeliveryRange} onChange={e => setMaxDeliveryRange(e.target.value)} />
                                </div>
                            </div>
                            <div className="v-grid-2">
                                <div className="v-field">
                                    <label className="v-label">Free up to (km)</label>
                                    <input type="number" className="v-input" value={freeDeliveryKms} onChange={e => setFreeDeliveryKms(e.target.value)} />
                                </div>
                                <div className="v-field">
                                    <label className="v-label">Fee / Extra km (₹)</label>
                                    <input type="number" className="v-input" value={deliveryFeePerKm} onChange={e => setDeliveryFeePerKm(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="v-btn v-btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VendorSettings;
