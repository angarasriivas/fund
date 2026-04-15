import React, { useEffect, useState } from 'react';
import { Trash2, CreditCard } from 'lucide-react';
import PaymentGatewayModal from '../components/PaymentGatewayModal';
import { apiFetch } from '../utils/api';

const ContributorListPage = () => {
    const [user, setUser] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedContributor, setSelectedContributor] = useState(null);

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
            const data = await res.json();
            setGroups(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await apiFetch(`/api/groups/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setGroups(groups.filter(g => g._id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const isAdmin = user && user.role === 'admin';

    return (
        <div className="animate-fade-in glass-card">
            <h2 className="text-gradient">Contributor List</h2>
            {groups.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>You haven't added anyone yet.</p>
            ) : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '1rem 0' }}>Contributor Name</th>
                            <th>Amount</th>
                            {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(g => (
                            <tr key={g._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{g.groupName}</td>
                                <td>₹{g.monthlyAmount}</td>
                                {isAdmin && (
                                <td style={{ textAlign: 'right' }}>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
                                        onClick={() => setSelectedContributor(g)}
                                    >
                                        <CreditCard size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                        Collect Payment
                                    </button>
                                    <button 
                                        className="btn" 
                                        style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                        onClick={() => handleDelete(g._id)}
                                    >
                                        <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                        Remove
                                    </button>
                                </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            
            <PaymentGatewayModal 
                isOpen={!!selectedContributor} 
                onClose={() => setSelectedContributor(null)} 
                contributor={selectedContributor}
                user={user}
                onPaymentSuccess={() => {
                    // Refresh data or simply show toast
                }}
            />
        </div>
    );
};

export default ContributorListPage;
