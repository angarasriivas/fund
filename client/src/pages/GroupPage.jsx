import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

const GroupPage = () => {
    const [user, setUser] = useState(null);
    const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [monthlyAmount, setMonthlyAmount] = useState('');

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            fetchGroups(storedUser._id);
        }
    }, []);

    const fetchGroups = async (userId) => {
        try {
            const res = await apiFetch(`/api/groups/user/${userId}`);
            const raw = await res.text();
            const data = raw ? JSON.parse(raw) : [];
            if (!res.ok) {
                alert(data?.message || 'Failed to load contributors. Please sign in again.');
                return;
            }
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            alert('Failed to load contributors (network error).');
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const res = await apiFetch('/api/groups/create-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groupName: newGroupName,
                    monthlyAmount: Number(monthlyAmount),
                    adminId: user._id
                })
            });
            const raw = await res.text();
            const data = raw ? JSON.parse(raw) : {};
            if (res.ok) {
                setNewGroupName('');
                setMonthlyAmount('');
                fetchGroups(user._id);
            } else {
                alert(data?.message || 'Failed to add contributor.');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to add contributor (network error).');
        }
    };

    const isAdmin = user && user.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
                <div className="glass-card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--danger)' }}>Access Denied</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Only Admins can add new contributors. Please contact your admin for support.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '500px' }}>
                <h3 className="text-gradient" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Add a Contributor</h3>
                <form onSubmit={handleCreateGroup}>
                    <div className="form-group">
                        <label className="input-label">Contributor Name</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="e.g. John Doe" 
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="input-label">Contribution Amount (₹)</label>
                        <input 
                            type="number" 
                            className="input-field" 
                            placeholder="1100" 
                            value={monthlyAmount}
                            onChange={(e) => setMonthlyAmount(e.target.value)}
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>Add Contributor</button>
                </form>
            </div>
        </div>
    );
};

export default GroupPage;
