import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, Users, CreditCard, Banknote, List, Menu, X } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user && user.role === 'admin';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        window.location.reload();
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className="navbar animate-fade-in">
            <h2 className="text-gradient navbar-brand" style={{ margin: 0 }}>
                FundFlow
            </h2>
            <button
                type="button"
                className="mobile-menu-btn"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
            >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
                <Link to="/" onClick={closeMenu}><Home size={18} style={{marginRight: '5px', verticalAlign: 'middle'}}/> Dashboard</Link>
                {isAdmin && <Link to="/group" onClick={closeMenu}><Users size={18} style={{marginRight: '5px', verticalAlign: 'middle'}}/> Add Contributor</Link>}
                <Link to="/list" onClick={closeMenu}><List size={18} style={{marginRight: '5px', verticalAlign: 'middle'}}/> Contributor List</Link>
                <Link to="/payments" onClick={closeMenu}><CreditCard size={18} style={{marginRight: '5px', verticalAlign: 'middle'}}/> Payments</Link>
                <Link to="/loans" onClick={closeMenu}><Banknote size={18} style={{marginRight: '5px', verticalAlign: 'middle'}}/> Loans</Link>
            </div>
            <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {user && (
                    <span style={{ 
                        background: isAdmin ? 'rgba(79, 70, 229, 0.2)' : 'rgba(156, 163, 175, 0.2)', 
                        color: isAdmin ? 'var(--primary-color)' : 'var(--text-muted)', 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: '12px', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        border: `1px solid ${isAdmin ? 'var(--primary-color)' : 'var(--border-color)'}`
                    }}>
                        {isAdmin ? 'Admin' : 'User View'}
                    </span>
                )}
                <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
