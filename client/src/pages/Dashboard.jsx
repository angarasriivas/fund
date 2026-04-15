import React, { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { apiFetch } from '../utils/api';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
            if (storedUser.role === 'admin') {
                fetchGroups(storedUser._id);
            }
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

    return (
        <div className="animate-fade-in">
            <h1 className="text-gradient">Hello, {user?.name}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Welcome to your FundFlow Dashboard.</p>

            {user?.role !== 'admin' ? (
                <div className="glass-card">
                    <h3>Limited User Access</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Your account is in user mode. Please contact your admin for contributor, payment, and loan details.
                    </p>
                </div>
            ) : (
            <div className="grid-3" style={{ marginBottom: '3rem' }}>
                <div className="glass-card">
                    <div className="flex-between">
                        <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Total Contributors</h3>
                        <Activity size={24} color="var(--primary-color)"/>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', margin: '1rem 0 0 0' }}>
                        {groups.length}
                    </h2>
                </div>

                <div className="glass-card">
                    <div className="flex-between">
                        <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Total Fund Created</h3>
                        <ArrowUpRight size={24} color="var(--danger)"/>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', margin: '1rem 0 0 0' }}>
                        ₹{groups.reduce((acc, curr) => acc + curr.monthlyAmount, 0)}
                    </h2>
                </div>

                <div className="glass-card">
                    <div className="flex-between">
                        <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Total Active Loans</h3>
                        <ArrowDownRight size={24} color="var(--success)"/>
                    </div>
                    <h2 style={{ fontSize: '2.5rem', margin: '1rem 0 0 0' }}>₹0</h2>
                </div>
            </div>
            )}

            <div className="glass-card">
                <h3>Recent Activity</h3>
                <p style={{ color: 'var(--text-muted)' }}>No recent activity to show.</p>
            </div>
        </div>
    );
};

export default Dashboard;
