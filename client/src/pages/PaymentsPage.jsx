import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

const PaymentsPage = () => {
    const [user, setUser] = useState(null);
    const [payments, setPayments] = useState([]);
    const [contributors, setContributors] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toLocaleString('default', { month: 'long' })
    );

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            fetchPayments(storedUser._id);
            fetchContributors(storedUser._id);
        }
    }, []);

    const fetchPayments = async (userId) => {
        try {
            const res = await apiFetch(`/api/payments/history/${userId}`);
            const data = await res.json();
            setPayments(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchContributors = async (userId) => {
        try {
            const res = await apiFetch(`/api/groups/user/${userId}`);
            const data = await res.json();
            setContributors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await apiFetch(`/api/payments/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setPayments(payments.filter(p => p._id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const isAdmin = user && user.role === 'admin';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const filteredPayments = payments.filter((p) => p.month === selectedMonth);
    const totalExpected = contributors.reduce((sum, c) => sum + (Number(c.monthlyAmount) || 0), 0);
    const totalCollected = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const paidContributorIds = new Set(filteredPayments.map((p) => p.groupId?._id).filter(Boolean));
    const paidCount = paidContributorIds.size;
    const pendingCount = Math.max(contributors.length - paidCount, 0);
    const pendingAmount = Math.max(totalExpected - totalCollected, 0);
    const latestPaymentByContributor = filteredPayments.reduce((acc, payment) => {
        const contributorId = payment.groupId?._id;
        if (!contributorId) return acc;
        const existing = acc[contributorId];
        if (!existing || new Date(payment.createdAt) > new Date(existing.createdAt)) {
            acc[contributorId] = payment;
        }
        return acc;
    }, {});

    return (
        <div className="animate-fade-in glass-card">
            <h2 className="text-gradient">Payment History</h2>

            <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                <label className="input-label">Select Month</label>
                <select
                    className="input-field"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ maxWidth: '240px' }}
                >
                    {months.map((month) => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Contributors</p>
                    <h3 style={{ margin: '0.4rem 0 0 0' }}>{contributors.length} / 18</h3>
                </div>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Expected ({selectedMonth})</p>
                    <h3 style={{ margin: '0.4rem 0 0 0' }}>₹{totalExpected}</h3>
                </div>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Collected ({selectedMonth})</p>
                    <h3 style={{ margin: '0.4rem 0 0 0', color: 'var(--success)' }}>₹{totalCollected}</h3>
                </div>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pending Amount</p>
                    <h3 style={{ margin: '0.4rem 0 0 0', color: 'var(--danger)' }}>₹{pendingAmount}</h3>
                </div>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Paid Members</p>
                    <h3 style={{ margin: '0.4rem 0 0 0' }}>{paidCount}</h3>
                </div>
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>Pending Members</p>
                    <h3 style={{ margin: '0.4rem 0 0 0' }}>{pendingCount}</h3>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3 className="text-gradient" style={{ marginBottom: '1rem' }}>
                    Monthly Member Status - {selectedMonth}
                </h3>
                {contributors.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No contributors added yet.</p>
                ) : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem 0' }}>Contributor</th>
                                <th>Monthly Amount</th>
                                <th>Paid Amount</th>
                                <th>Method</th>
                                <th>Paid On</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contributors.map((contributor) => {
                                const payment = latestPaymentByContributor[contributor._id];
                                const isPaid = !!payment;
                                return (
                                    <tr key={contributor._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{contributor.groupName}</td>
                                        <td>₹{contributor.monthlyAmount}</td>
                                        <td>{isPaid ? `₹${payment.amount}` : '-'}</td>
                                        <td>{isPaid ? (payment.paymentMethod || 'Online') : '-'}</td>
                                        <td style={{ fontSize: '0.9rem' }}>
                                            {isPaid
                                                ? new Date(payment.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                                                : '-'}
                                        </td>
                                        <td>
                                            <span style={{
                                                background: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                color: isPaid ? 'var(--success)' : 'var(--danger)',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {isPaid ? 'PAID' : 'PENDING'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3 className="text-gradient" style={{ marginBottom: '1rem' }}>Payment Entries - {selectedMonth}</h3>
                {filteredPayments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No payment history recorded for this month.</p>
                ) : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1.5rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '1rem 0' }}>Date & Time</th>
                            <th>Month</th>
                            <th>Contributor</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map(p => (
                            <tr key={p._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem 0', fontSize: '0.9rem' }}>{new Date(p.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) || p.month}</td>
                                <td>{p.month}</td>
                                <td>{p.groupId?.groupName || 'N/A'}</td>
                                <td>₹{p.amount}</td>
                                <td>
                                    <span style={{ 
                                        background: 'rgba(255, 255, 255, 0.1)', 
                                        padding: '0.2rem 0.5rem', 
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }}>
                                        {p.paymentMethod || 'Online'}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ 
                                        background: p.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', 
                                        color: p.status === 'paid' ? 'var(--success)' : 'var(--danger)',
                                        padding: '0.2rem 0.5rem', 
                                        borderRadius: '4px',
                                        fontSize: '0.9rem'
                                    }}>
                                        {p.status.toUpperCase()}
                                    </span>
                                </td>
                                {isAdmin && (
                                <td style={{ textAlign: 'right' }}>
                                    <button 
                                        className="btn" 
                                        style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                        onClick={() => handleDelete(p._id)}
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
            </div>
        </div>
    );
};

export default PaymentsPage;
